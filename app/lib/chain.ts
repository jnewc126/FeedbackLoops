import type {SupabaseClient} from '@supabase/supabase-js';
import {captionPrompt, type HumorStyle} from './humor';

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

export type ChainStep = {
    id: number | null;
    stepOrder: number;
    title: string;
    template: string;
    modelId: number | null;
    modelKey: string;
    includeImage: boolean;
};

export type Chain = {
    id: number | null;
    steps: ChainStep[];
    terms: string;
    examples: string;
};

// Used when the prompt-chain tables are empty or unreadable: the original one-step prompt.
export function fallbackChain(style: HumorStyle): Chain {
    return {
        id: null,
        terms: '',
        examples: '',
        steps: [{id: null, stepOrder: 1, title: 'Write the caption', template: captionPrompt(style), modelId: null, modelKey: DEFAULT_MODEL, includeImage: true}],
    };
}

function pickWeighted<T extends { weight: number }>(items: T[]) {
    const total = items.reduce((n, i) => n + i.weight, 0);
    let roll = Math.random() * total;
    for (const item of items) {
        roll -= item.weight;
        if (roll < 0) return item;
    }
    return items[items.length - 1];
}

// Picks a chain for the style from the prompt chain mix, then loads its steps, terms and examples.
export async function loadChain(supabase: SupabaseClient, style: HumorStyle): Promise<Chain> {
    const {data: mix, error} = await supabase.from('prompt_chain_mix')
        .select('chain_id, weight, prompt_chains!inner(humor_style)')
        .eq('is_enabled', true).gt('weight', 0).eq('prompt_chains.humor_style', style);
    if (error || !mix?.length) return fallbackChain(style);
    const chainId = pickWeighted(mix).chain_id as number;

    const [{data: steps}, {data: terms}, {data: examples}] = await Promise.all([
        supabase.from('prompt_chain_steps').select('id, step_order, title, prompt_template, include_image, model_id, llm_models(model_key, is_active)')
            .eq('chain_id', chainId).order('step_order'),
        supabase.from('terms').select('term, definition').or(`humor_style.eq.${style},humor_style.is.null`),
        supabase.from('caption_examples').select('image_description, caption')
            .eq('is_active', true).or(`humor_style.eq.${style},humor_style.is.null`).limit(5),
    ]);
    if (!steps?.length) return fallbackChain(style);

    return {
        id: chainId,
        steps: steps.map((s) => {
            const model = s.llm_models as unknown as { model_key: string; is_active: boolean } | null;
            return {
                id: s.id,
                stepOrder: s.step_order,
                title: s.title,
                template: s.prompt_template,
                includeImage: s.include_image,
                modelId: model?.is_active ? s.model_id : null,
                modelKey: model?.is_active ? model.model_key : DEFAULT_MODEL,
            };
        }),
        terms: terms?.length
            ? `Comedy terms you can lean on:\n${terms.map((t) => `- ${t.term}: ${t.definition}`).join('\n')}`
            : '',
        examples: examples?.length
            ? `Example captions for the tone (don't copy them):\n${examples.map((e) => `- Photo: ${e.image_description} Caption: "${e.caption}"`).join('\n')}`
            : '',
    };
}

export function renderPrompt(template: string, vars: Record<string, string>) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '').replace(/\n{3,}/g, '\n\n').trim();
}
