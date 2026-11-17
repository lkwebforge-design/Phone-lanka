/* PhoneLanka seller insights, review responses and verification requests. */
(()=>{
'use strict';
const db=window.supabase.createClient('https://ivacdswettainjderwwz.supabase.co','sb_publishable_BSGXyRFXfusvraBcA-nU0g_xxQqcyYe',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'Rs. '+Number(v||0).toLocaleString('en-LK');
async function mountSellerTools(){const u=await db.auth.getUser();if(u.error||!u.data.user)return;const user=u.data.user;const s=await db.from('seller_shops').select('id,shop_name,verification_status,verification_note,status').eq('owner_id',user.id).maybeSingle();if(s.error||!s.data)return;const shop=s.data;const host=$('modalContent');if(!host||$('plSellerInsights'))return;
 const since=new Date(Date.now()-30*86400000).toISOString();
 const [events,reviews,sub]=await Promise.all([
  db.from('seller_analytics_events').select('event_type,occurred_at,listing_id').eq('seller_id',user.id).gte('occurred_at',since),
  db.from('shop_reviews').select('id,rating,review_text,status,seller_response,created_at').eq('shop_id',shop.id).order('created_at',{ascending:false}).limit(25),
  db.from('seller_subscriptions').select('plan_code,status,ends_at').eq('shop_id',shop.id).maybeSingle()
 ]);
 const ev=events.error?[]:(events.data||[]),rv=reviews.error?[]:(reviews.data||[]),plan=sub.data||{plan_code:'free',status:'free'};
 const count=t=>ev.filter(x=>x.event_type===t).length;
 const section=document.createElement('section');section.id='plSellerInsights';section.style.cssText='border-top:1px solid #dce4ef;padding-top:18px;margin-top:18px;display:grid;gap:16px';
 section.innerHTML='<div><h3 style="margin:0 0 5px">Shop performance · last 30 days</h3><p class="pl-muted">Based on recorded activity on PhoneLanka. These are event counts, not unique visitors.</p><div class="pl-dash-stats"><div><b>'+count('shop_view')+'</b><small>Shop views</small></div><div><b>'+count('listing_view')+'</b><small>Phone views</small></div><div><b>'+count('whatsapp_click')+'</b><small>WhatsApp clicks</small></div></div><div class="pl-dash-stats" style="margin-top:8px"><div><b>'+count('save')+'</b><small>Phone saves</small></div><div><b>'+count('compare')+'</b><small>Comparisons</small></div><div><b>'+count('phone_call_click')+'</b><small>Phone calls</small></div></div></div>'+
 '<div><h3 style="margin:0 0 5px">Shop verification</h3><p class="pl-muted">Current status: <b>'+esc(shop.verification_status||'unverified')+'</b>. Verification is reviewed by the PhoneLanka admin team; it is never automatic.</p>'+(shop.verification_note?'<p class="notice">'+esc(shop.verification_note)+'</p>':'')+((shop.status==='active'&&shop.verification_status!=='pending'&&shop.verification_status!=='verified')?'<button class="btn soft" id="plRequestVerification">Request shop verification</button>':'')+'</div>'+
 '<div><h3 style="margin:0 0 5px">Seller plan</h3><p class="pl-muted">Plan: <b>'+esc(plan.plan_code)+'</b> · Status: <b>'+esc(plan.status)+'</b>. Paid plan activation will be connected after payment processing is configured.</p></div>'+
 '<div><h3 style="margin:0 0 8px">Buyer reviews</h3>'+ (rv.length?rv.map(x=>'<article style="padding:12px 0;border-top:1px solid #e5ebf3"><b>'+esc(x.rating)+'/5</b> · <span class="pl-listing-status">'+esc(x.status)+'</span><p style="margin:6px 0">'+esc(x.review_text||'No written comment')+'</p>'+(x.seller_response?'<p class="notice"><b>Your response:</b> '+esc(x.seller_response)+'</p>':(x.status==='published'?'<form data-pl-review="'+esc(x.id)+'"><textarea name="response" rows="2" maxlength="1200" required placeholder="Write a public reply to this review" style="width:100%;padding:10px;border:1px solid #dce4ef;border-radius:10px"></textarea><button class="btn soft" style="margin-top:7px">Reply to review</button></form>':''))+'</article>').join(''):'<p class="pl-muted">No buyer reviews yet.</p>')+'</div>';
 host.appendChild(section);
 const verify=$('plRequestVerification');if(verify)verify.onclick=async()=>{verify.disabled=true;try{const r=await db.rpc('request_shop_verification');if(r.error)throw r.error;verify.remove();const p=section.querySelector('h3:nth-of-type(2)')?.nextElementSibling;if(p)p.innerHTML='Current status: <b>pending</b>. Your request has been sent to the PhoneLanka admin team.';}catch(e){alert(e.message);verify.disabled=false;}};
 section.querySelectorAll('[data-pl-review]').forEach(form=>form.onsubmit=async e=>{e.preventDefault();const b=form.querySelector('button');b.disabled=true;try{const response=new FormData(form).get('response');const r=await db.rpc('respond_to_shop_review',{p_review_id:form.dataset.plReview,p_response:String(response).trim()});if(r.error)throw r.error;form.outerHTML='<p class="notice">Your response was posted.</p>';}catch(err){alert(err.message);b.disabled=false;}});
}
const original=window.openSell;
if(typeof original==='function')window.openSell=async function(...args){await original.apply(this,args);try{await mountSellerTools();}catch(e){console.warn('Seller tools unavailable',e);}};
})();
