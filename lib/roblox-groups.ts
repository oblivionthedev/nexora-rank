export type RobloxGroupDetails = { id: string; name: string; description: string; memberCount: number; iconUrl: string | null };

export async function getRobloxGroupDetails(groupId: string): Promise<RobloxGroupDetails | null> {
  if (!/^\d+$/.test(groupId)) return null;
  const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),8000);
  try {
    const [groupResponse,iconResponse]=await Promise.all([
      fetch(`https://groups.roblox.com/v1/groups/${groupId}`,{cache:"no-store",signal:controller.signal}),
      fetch(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=150x150&format=Png&isCircular=false`,{cache:"no-store",signal:controller.signal}),
    ]);
    if(!groupResponse.ok)return null;
    const group=await groupResponse.json() as {id:number;name:string;description?:string;memberCount?:number};
    const icons=iconResponse.ok?await iconResponse.json() as {data?:Array<{imageUrl?:string}>}:{data:[]};
    return {id:String(group.id),name:group.name,description:group.description||"",memberCount:group.memberCount||0,iconUrl:icons.data?.[0]?.imageUrl||null};
  } catch{return null} finally{clearTimeout(timeout)}
}
