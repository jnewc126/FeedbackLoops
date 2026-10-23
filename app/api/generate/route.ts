import {NextResponse} from 'next/server';
import {createClient} from '@/app/lib/supabase/server';
import {GoogleGenerativeAI} from '@google/generative-ai';
import {captionPrompt, isHumorStyle} from '@/app/lib/humor';

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
    const prompt = captionPrompt(humorStyle);
    let caption: string;
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({model: 'gemini-3.5-flash-lite'});
        const result = await model.generateContent([{inlineData: {data: base64Data, mimeType: file.type}}, prompt,]);
        // Gemini's safety filters can refuse a caption (most often for Dark Humor). Say so plainly.
        const blocked = result.response.promptFeedback?.blockReason
            || result.response.candidates?.[0]?.finishReason === 'SAFETY';
        if (blocked) {
            await discardUpload();
            return NextResponse.json({error: 'The AI wouldn’t write that kind of joke for this photo. Try a different humor style or another photo.'}, {status: 422});
        }
        caption = result.response.text().trim();
    } catch (e) {
        console.error('Gemini caption failed', e);
        await discardUpload();
        return NextResponse.json({error: 'The AI couldn’t caption this photo. Try again, or try a different photo.'}, {status: 502});
    }
    if (!caption) {
        await discardUpload();
        return NextResponse.json({error: 'The AI came back empty-handed. Try a different photo.'}, {status: 502});
    }
    const {data: generation, error: insertError} = await supabase.from('generations').insert({
        user_id: user.id,
        image_url: publicUrl,
        prompt,
        caption,
        humor_style: humorStyle,
    }).select().single();
    if (insertError) {
        console.error('Saving generation failed', insertError);
        await discardUpload();
        return NextResponse.json({error: 'Your caption couldn’t be saved. Try again in a moment.'}, {status: 500});
    }
    return NextResponse.json({generation});
}
