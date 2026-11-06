import { supabase } from '@/lib/supabase';

export default async function Home() {
   const { data: characters, error } = await supabase.from('characters').select('*');
   
   if (error) {
    return <div className="text-red-500 p-8">Error de conexión: {error.message}</div>;
   }
   
   return(
    <main className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Estado de la Base de Datos</h1>
      <div className="bg-gray-900 p-4 rounded-lg overflow.auto">
        <pre>
          { JSON.stringify(characters, null, 2)}
        </pre>
      </div>
    </main>
   );
}