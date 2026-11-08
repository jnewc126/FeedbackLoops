import {NextResponse} from 'next/server';
import {createClient} from '@/app/lib/supabase/server';
import {GoogleGenerativeAI} from '@google/generative-ai';
import {isHumorStyle} from '@/app/lib/humor';
import {loadChain, renderPrompt} from '@/app/lib/chain';

// Formats Gemini accepts as image input, mapped to the extension we store them under.
const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
};
const MAX_BYTES = 4.5 * 1024 * 1024;

export async function POST(request: Request) {
    const supabase = await createClient();
    const {data: {user},} = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({error: 'You must be signed in.'}, {status: 401});
    }
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file) {
        return NextResponse.json({error: 'No image provided.'}, {status: 400});
    }
    const humorStyle = formData.get('style');
    if (!isHumorStyle(humorStyle)) {
        return NextResponse.json({error: 'Pick a humor style first.'}, {status: 400});
    }
    const fileExt = EXTENSIONS[file.type];
    if (!fileExt) {
        return NextResponse.json({error: 'This photo format isn’t supported. Try a JPG or PNG.'}, {status: 400});
    }
    if (file.size > MAX_BYTES) {
        return NextResponse.json({error: 'This photo is too large. Try one under 4 MB.'}, {status: 413});
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const {error: uploadError} = await supabase.storage.from('generations').upload(filePath, buffer, {contentType: file.type});
    if (uploadError) {
        console.error('Photo upload failed', uploadError);
        return NextResponse.json({error: 'Your photo couldn’t be uploaded. Try again in a moment.'}, {status: 500});
    }
    // Anything that fails after the upload removes the photo, so storage never holds orphans.
    const discardUpload = () => supabase.storage.from('generations').remove([filePath]);
    const {data: {publicUrl},} = supabase.storage.from('generations').getPublicUrl(filePath);
    const chain = await loadChain(supabase, humorStyle);

    // Every click is logged as a generation request, and every AI call as an LLM response.
    // Logging is best-effort: if it fails, captioning still works.
    const {data: logged} = await supabase.from('generation_requests')
        .insert({user_id: user.id, humor_style: humorStyle, chain_id: chain.id}).select('id').maybeSingle();
    const requestId = logged?.id as string | undefined;
    const finishRequest = async (status: 'succeeded' | 'failed' | 'blocked', fields: Record<string, unknown> = {}) => {
        if (!requestId) return;
        await supabase.from('generation_requests')
            .update({status, completed_at: new Date().toISOString(), ...fields}).eq('id', requestId);
    };
    const fail = async (status: 'failed' | 'blocked', error: string, httpStatus: number) => {
        await discardUpload();
        await finishRequest(status, {error});
        return NextResponse.json({error}, {status: httpStatus});
    };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    let previous = '';
    const outputs: Record<string, string> = {};
    let prompt = '';
    for (const step of chain.steps) {
        prompt = renderPrompt(step.template, {...outputs, previous, terms: chain.terms, examples: chain.examples});
        const started = Date.now();
        let text = '';
        let finishReason: string | null = null;
        let blocked = false;
        try {
            const model = genAI.getGenerativeModel({model: step.modelKey});
            // Some steps only work from earlier steps' text, e.g. "turn step 2 into five captions".
            const parts = step.includeImage ? [{inlineData: {data: base64Data, mimeType: file.type}}, prompt] : [prompt];
            const result = await model.generateContent(parts);
            finishReason = result.response.promptFeedback?.blockReason ?? result.response.candidates?.[0]?.finishReason ?? null;
            // Gemini's safety filters can refuse a caption (most often for Dark Humor). Say so plainly.
            blocked = !!result.response.promptFeedback?.blockReason || finishReason === 'SAFETY';
            if (!blocked) text = result.response.text().trim();
        } catch (e) {
            console.error(`Gemini step ${step.stepOrder} failed`, e);
            finishReason = 'ERROR';
        }
        if (requestId) {
            await supabase.from('llm_responses').insert({
                request_id: requestId,
                step_id: step.id,
                model_id: step.modelId,
                step_order: step.stepOrder,
                prompt,
                response_text: text || null,
                finish_reason: finishReason,
                latency_ms: Date.now() - started,
            });
        }
        if (blocked) {
            return fail('blocked', 'The AI wouldn’t write that kind of joke for this photo. Try a different humor style or another photo.', 422);
        }
        if (finishReason === 'ERROR') {
            return fail('failed', 'The AI couldn’t caption this photo. Try again, or try a different photo.', 502);
        }
        if (!text) {
            return fail('failed', 'The AI came back empty-handed. Try a different photo.', 502);
        }
        previous = text;
        outputs[`step_${chain.steps.indexOf(step) + 1}`] = text;
    }
    const caption = previous;
    const {data: generation, error: insertError} = await supabase.from('generations').insert({
        user_id: user.id,
        image_url: publicUrl,
        prompt,
        caption,
        humor_style: humorStyle,
    }).select().single();
    if (insertError) {
        console.error('Saving generation failed', insertError);
        return fail('failed', 'Your caption couldn’t be saved. Try again in a moment.', 500);
    }
    await finishRequest('succeeded', {generation_id: generation.id, image_url: publicUrl});
    return NextResponse.json({generation});
}
