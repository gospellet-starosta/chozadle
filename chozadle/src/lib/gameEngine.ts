import { supabase } from './supabase';

export async function getDailyCharacter() {
    const { data: ids, error: idsError} = await supabase
    .from('characters')
    .select('id')
    .order('id', {ascending: true});

    if (idsError || !ids || ids.length === 0) {
        throw new Error('Error al obtener el catálogo de personajes');
    }

    const daysSinceEpoch = Math.floor(Date.now() / 86400000);

    const targetIndex = daysSinceEpoch % ids.length;
    const targetId = ids[targetIndex].id;

    const { data: dailyCharacter, error: charError} = await supabase
    .from('characters')
    .select('*')
    .eq('id', targetId)
    .single();

    if (charError) {
        throw new Error('Error al obtener el personaje diario.');
    }
    return dailyCharacter;
}