import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!/^[a-z0-9]{20,40}$/.test(id))return NextResponse.json({error:'Enlace inválido'},{status:400})
  try{const shared=await db.sharedPlay.findUnique({where:{id}});if(!shared||shared.expiresAt<=new Date()){if(shared)await db.sharedPlay.delete({where:{id}});return NextResponse.json({error:'La jugada compartida venció o no existe'},{status:404})}
    return NextResponse.json({data:shared.data,expiresAt:shared.expiresAt},{headers:{'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}})
  }catch(e){console.error(e);return NextResponse.json({error:'No pudimos abrir la jugada'},{status:500})}
}
