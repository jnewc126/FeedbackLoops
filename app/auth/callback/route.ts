import {NextResponse} from 'next/server';
import {createClient} from '@/app/lib/supabase/server';

export async function GET(request: Request) {
    const {searchParams, origin} = new URL(request.url);
    const code = searchParams.get('code');
    if (code) {
        const supabase = await createClient();
        await supabase.auth.exchangeCodeForSession(code);
        // Admins control who may sign in with allowed domains and whitelisted emails.
        // If the check itself can't run, sign-in goes ahead rather than locking everyone out.
        const {data: allowed, error} = await supabase.rpc('is_signup_allowed');
        if (error) console.error('Signup check failed', error);
        if (!error && allowed === false) {
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/?signup=blocked`);
        }
    }
    return NextResponse.redirect(`${origin}/`);
}
