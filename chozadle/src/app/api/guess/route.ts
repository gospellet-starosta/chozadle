import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDailyCharacter } from '@/lib/gameEngine';

export async function POST(request: Request){
    try {
        const body = await request.json();
        const { guessedId } = body;

        if(!guessedId) {
            return NextResponse.json({ error: 'Falta el ID de personaje'}, { status: 400});
        }

        const dailyCharacter = await getDailyCharacter();

        const { data: guessedCharacter, error} = await supabase
        .from('characters')
        .select('*')
        .eq('id', guessedId)
        .single();

        if (error || !guessedCharacter) {
            return NextResponse.json({ error: 'Personaje no encontrado en la Base de Datos'}, {status: 404});
        } 

        if (dailyCharacter.id === guessedCharacter.id) {
            return NextResponse.json({
                isCorrect: true,
                characterData: guessedCharacter,
                iconic_phrase: dailyCharacter.iconic_phrase 
            });
        }
        
        const feedback = {
            isCorrect: false,
            characterData: guessedCharacter,
            comparision: {
                gender: guessedCharacter.gender === dailyCharacter.gender ? 'match' : 'miss',
                nationality: guessedCharacter.nationality === dailyCharacter.nationality ? 'match' : 'miss',
                appearance_year:
                guessedCharacter.appearance_year === dailyCharacter.appearance_year ? 'match':
                guessedCharacter.appearance_year < dailyCharacter.appearance_year ? 'higher' : 'lower',
            }
        };

        return NextResponse.json(feedback);
    } catch (error) {
        return NextResponse.json({ error: 'Error interno de servidor'}, { status: 500});
    }
}