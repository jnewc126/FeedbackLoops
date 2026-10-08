'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {createClient} from '@/app/lib/supabase/client';

export default function GeneratePage() {
    const router = useRouter();
    const supabase = createClient();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [caption, setCaption] = useState<string | null>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setCaption(null);
        setError('');
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        const {data: {user},} = await supabase.auth.getUser();
        if (!user) {
            router.push('/');
            return;
        }
        setLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/generate', {method: 'POST', body: formData,});
        const json = await res.json();
        setLoading(false);
        if (!res.ok) {
            setError(json.error ?? 'Something went wrong.');
            return;
        }
        setCaption(json.generation.caption);
    };
    return (<div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-10">
        <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between"><h1
                className="text-xl font-bold text-zinc-900">Generate a Caption</h1> <Link href="/"
                                                                                          className="text-sm font-medium text-zinc-500 underline"> Back
                home </Link></div>
            <form onSubmit={handleSubmit}><input type="file" accept="image/*" onChange={handleFileChange}
                                                 className="mb-4 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:transition hover:file:bg-zinc-800"/> {preview && (
                <img src={preview} alt="Preview" className="mb-4 h-48 w-full rounded-md object-cover"/>)} {error &&
                <p className="mb-4 text-sm text-red-600">{error}</p>} {caption && (
                <p className="mb-4 rounded-md bg-zinc-100 p-3 text-sm italic text-zinc-800"> &quot;{caption}&quot; </p>)}
                <button type="submit" disabled={!file || loading}
                        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"> {loading ? 'Generating...' : 'Generate caption'} </button>
            </form>
            {caption && (
                <Link href="/" className="mt-4 block text-center text-sm font-medium text-zinc-700 underline"> View in
                    feed </Link>)} </div>
    </div>);
}