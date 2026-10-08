import {NextResponse} from 'next/server';
import {createClient} from '@/app/lib/supabase/server';
import {GoogleGenerativeAI} from '@google/generative-ai';

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
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const {error: uploadError} = await supabase.storage.from('generations').upload(filePath, buffer, {contentType: file.type});
    if (uploadError) {
        return NextResponse.json({error: uploadError.message}, {status: 500});
    }
    const {data: {publicUrl},} = supabase.storage.from('generations').getPublicUrl(filePath);
    const prompt = 'Write a short, funny, clever caption for this photo. Keep it under 20 words.';
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({model: 'gemini-3.5-flash-lite'});
    const result = await model.generateContent([{inlineData: {data: base64Data, mimeType: file.type}}, prompt,]);
    const caption = result.response.text();
    const {data: generation, error: insertError} = await supabase.from('generations').insert({
        user_id: user.id,
        image_url: publicUrl,
        prompt,
        caption,
    }).select().single();
    if (insertError) {
        return NextResponse.json({error: insertError.message}, {status: 500});
    }
    return NextResponse.json({generation});
}