import {createClient} from '@supabase/supabase-js';

export default async function Home() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const {data, error} = await supabase.from('messages').select('id, text').limit(10);
    if (error) return <p>{error.message}</p>;
    return (<ul> {data?.map((row) => (<li key={row.id}>{row.text}</li>))} </ul>);
}