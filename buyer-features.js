/* PhoneLanka buyer features — isolated from existing marketplace rendering. */
(()=>{
'use strict';
const URL='https://ivacdswettainjderwwz.supabase.co';
const KEY='sb_publishable_BSGXyRFXfusvraBcA-nU0g_xxQqcyYe';
const db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const liveId=id=>String(id||'').startsWith('live-')?String(id).slice(5):null;
const money=v=>'Rs. '+Number(v||0).toLocaleString('en-LK');
let currentUser=null, authBusy=false;
async function refreshUser(){const r=await db.auth.getUser();currentUser=r.data?.user||null;return currentUser;}
function modal(title,html){$('modalTitle').textContent=title;$('modalContent').innerHTML=html;$('modalBack').classList.add('show');$('modalBack').querySelector('.modal').classList.remove('shop-storefront-modal');}
function authPrompt(after){
 const html='<div class="pl-panel"><p class="pl-muted">Sign in to sync saved phones, price alerts and notifications across your devices.</p><form id="plBuyerAuth"><div class="formrow"><label>Email</label><input name="email" type="email" required autocomplete="email"></div><div class="formrow"><label>Password</label><input name="password" type="password" required minlength="6" autocomplete="current-password"></div><div class="formrow" id="plBuyerNameRow" hidden><label>Your name</label><input name="name" maxlength="80"></div><p id="plBuyerAuthMsg" class="pl-status" aria-live="polite"></p><button class="btn primary pl-wide" type="submit">Sign in</button><button class="pl-link" type="button" id="plBuyerToggle">Create a buyer account</button></form></div>';
 modal('PhoneLanka account',html);
 let signup=false;
 $('plBuyerToggle').onclick=()=>{signup=!signup;$('plBuyerNameRow').hidden=!signup;$('plBuyerAuthMsg').textContent='';$('plBuyerAuth').querySelector('[type=submit]').textContent=signup?'Create account':'Sign in';$('plBuyerToggle').textContent=signup?'I already have an account':'Create a buyer account';};
 $('plBuyerAuth').onsubmit=async e=>{e.preventDefault();if(authBusy)return;authBusy=true;const f=e.currentTarget,v=new FormData(f),b=f.querySelector('[type=submit]'),m=$('plBuyerAuthMsg');b.disabled=true;m.textContent='Connecting securely…';try{
  let result;if(signup)result=await db.auth.signUp({email:String(v.get('email')).trim(),password:String(v.get('password')),options:{data:{full_name:String(v.get('name')||'PhoneLanka buyer').trim()}}});else result=await db.auth.signInWithPassword({email:String(v.get('email')).trim(),password:String(v.get('password'))});
  if(result.error)throw result.error;
  await refreshUser();if(!currentUser){m.textContent='Check your email to confirm your account, then sign in.';return;}
  closeModal();await loadSaved();if(typeof after==='function')await after();
 }catch(err){m.textContent=err.message||'Could not sign in.';}finally{authBusy=false;b.disabled=false;}
 };
}
async function requireUser(after){if(await refreshUser())return true;authPrompt(after);return false;}
async function loadSaved(){if(!currentUser)return;try{const r=await db.from('saved_phones').select('listing_id').eq('user_id',currentUser.id);if(r.error)throw r.error;const ids=(r.data||[]).map(x=>'live-'+x.listing_id);const local=JSON.parse(localStorage.getItem('pl-saved')||'[]').filter(x=>!String(x).startsWith('live-'));localStorage.setItem('pl-saved',JSON.stringify([...new Set([...local,...ids])]));const count=$('savedCount');if(count)count.textContent=JSON.parse(localStorage.getItem('pl-saved')||'[]').length;}catch(e){console.warn('Could not load synced saved phones',e);}}
async function saveLive(id){if(!await requireUser(()=>saveLive(id)))return;const listing=liveId(id);const exists=await db.from('saved_phones').select('id').eq('user_id',currentUser.id).eq('listing_id',listing).maybeSingle();if(exists.error)throw exists.error;if(exists.data){const d=await db.from('saved_phones').delete().eq('id',exists.data.id);if(d.error)throw d.error;}else{const i=await db.from('saved_phones').insert({user_id:currentUser.id,listing_id:listing});if(i.error)throw i.error;}await loadSaved();}
const originalToggle=window.toggleSave;
if(typeof originalToggle==='function')window.toggleSave=function(id){if(!liveId(id)){return originalToggle(id);}saveLive(id).then(()=>{if(typeof window.render==='function')window.render();}).catch(e=>alert(e.message));};
async function recordView(id){if(!currentUser)return;const listing=liveId(id);try{const d=await db.from('recently_viewed').delete().eq('user_id',currentUser.id).eq('listing_id',listing);if(d.error)throw d.error;const i=await db.from('recently_viewed').insert({user_id:currentUser.id,listing_id:listing});if(i.error)throw i.error;}catch(e){console.warn('Recently viewed update failed',e);}}
async function addPriceAlert(id){if(!await requireUser(()=>addPriceAlert(id)))return;const listing=liveId(id);const target=prompt('Notify me when this phone reaches what price? Enter an amount in LKR.');if(target===null)return;const amount=Number(String(target).replace(/[, ]/g,''));if(!Number.isFinite(amount)||amount<=0)return alert('Enter a valid price greater than zero.');const r=await db.from('price_alerts').insert({user_id:currentUser.id,listing_id:listing,target_price_lkr:amount,is_active:true});if(r.error)throw r.error;alert('Price alert saved. PhoneLanka will show an in-app alert when the price-check service is enabled.');}
async function reportListing(id){if(!await requireUser(()=>reportListing(id)))return;const reason=prompt('Why are you reporting this listing?\nOptions: suspicious price, fake listing, incorrect details, unavailable phone, other');if(reason===null)return;if(reason.trim().length<3)return alert('Please enter a short reason.');const details=prompt('Add details (optional):')||'';const r=await db.from('listing_reports').insert({reporter_id:currentUser.id,listing_id:liveId(id),reason:reason.trim().slice(0,80),details:details.trim().slice(0,1200),status:'open'});if(r.error)throw r.error;alert('Report submitted. Our moderation team can now review it.');}
const originalShow=window.showProduct;
let activeListingId=null,activeShopId=null;
async function recordAnalytics(shopId,listingId,eventType){if(!shopId)return;try{const r=await db.rpc('record_public_seller_analytics',{p_shop_id:shopId,p_listing_id:listingId||null,p_event_type:eventType});if(r.error)throw r.error;}catch(e){console.debug('PhoneLanka analytics event skipped',e.message);}}
if(typeof originalShow==='function')window.showProduct=function(id){originalShow(id);if(!liveId(id))return;activeListingId=liveId(id);recordView(id);db.from('phone_listings').select('shop_id').eq('id',activeListingId).maybeSingle().then(r=>{if(!r.error&&r.data){activeShopId=r.data.shop_id;recordAnalytics(activeShopId,activeListingId,'listing_view');}});setTimeout(()=>{const host=$('modalContent');if(!host||host.querySelector('.pl-buyer-actions'))return;const bar=document.createElement('div');bar.className='pl-buyer-actions';bar.style.cssText='display:flex;flex-wrap:wrap;gap:9px;margin-top:12px';bar.innerHTML='<button class="btn soft" type="button" data-pl-alert>Price alert</button><button class="btn soft" type="button" data-pl-report>Report listing</button>';host.appendChild(bar);bar.querySelector('[data-pl-alert]').onclick=()=>addPriceAlert(id).catch(e=>alert(e.message));bar.querySelector('[data-pl-report]').onclick=()=>reportListing(id).catch(e=>alert(e.message));},0);};
async function showNotifications(){if(!await requireUser(()=>showNotifications()))return;const r=await db.from('user_notifications').select('id,title,body,notification_type,action_url,read_at,created_at').eq('user_id',currentUser.id).order('created_at',{ascending:false}).limit(40);if(r.error)throw r.error;const rows=r.data||[];modal('Your notifications',rows.length?rows.map(n=>'<article style="padding:13px 0;border-bottom:1px solid #e5ebf3;opacity:'+(n.read_at?'.68':'1')+'"><b>'+esc(n.title)+'</b><p style="margin:5px 0;color:#536783;font-size:13px">'+esc(n.body)+'</p><small style="color:#73839a">'+new Date(n.created_at).toLocaleString()+'</small>'+(n.action_url?'<p><a href="'+esc(n.action_url)+'">Open details →</a></p>':'')+(!n.read_at?'<button class="pl-link" data-pl-read="'+esc(n.id)+'">Mark as read</button>':'<small> · Read</small>')+'</article>').join(''):'<p class="pl-muted">No notifications yet. Updates from PhoneLanka will appear here.</p>');$('modalContent').querySelectorAll('[data-pl-read]').forEach(b=>b.onclick=async()=>{const u=await db.from('user_notifications').update({read_at:new Date().toISOString()}).eq('id',b.dataset.plRead);if(u.error)alert(u.error.message);else showNotifications();});}
function addNotificationButton(){const savedBtn=$('savedBtn');if(!savedBtn||$('plNotificationsBtn'))return;const b=document.createElement('button');b.id='plNotificationsBtn';b.className=savedBtn.className||'iconbtn';b.type='button';b.textContent='Notifications';b.style.marginLeft='8px';b.onclick=()=>showNotifications().catch(e=>alert(e.message));savedBtn.insertAdjacentElement('afterend',b);}

async function showSavedDashboard(){
 if(!await requireUser(()=>showSavedDashboard()))return;
 const [savedRows,viewRows]=await Promise.all([
  db.from('saved_phones').select('id,listing_id,created_at,phone_listings(id,title,price_lkr,brand,model,condition,image_paths,seller_shops(shop_name,town,district))').eq('user_id',currentUser.id).order('created_at',{ascending:false}),
  db.from('recently_viewed').select('id,listing_id,viewed_at,phone_listings(id,title,price_lkr,brand,model,condition,image_paths,seller_shops(shop_name,town,district))').eq('user_id',currentUser.id).order('viewed_at',{ascending:false}).limit(20)
 ]);
 if(savedRows.error)throw savedRows.error;if(viewRows.error)throw viewRows.error;
 const renderRows=(rows,isSaved)=>rows.map(row=>{const p=row.phone_listings;if(!p)return '';const shop=p.seller_shops||{},path=(p.image_paths||[])[0],src=path?db.storage.from('shop-assets').getPublicUrl(path).data.publicUrl:'';return '<article style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #e5ebf3">'+(src?'<img src="'+esc(src)+'" alt="" style="width:64px;height:68px;object-fit:cover;border-radius:10px;background:#edf3fa">':'<div style="width:64px;height:68px;display:grid;place-items:center;background:#edf3fa;border-radius:10px">PL</div>')+'<div style="flex:1;min-width:0"><b>'+esc(p.title)+'</b><div class="meta">'+money(p.price_lkr)+' · '+esc(shop.shop_name||'PhoneLanka seller')+'</div><small class="pl-muted">'+esc([shop.town,shop.district].filter(Boolean).join(' · '))+'</small></div>'+(isSaved?'<button class="pl-link" data-pl-remove="'+esc(row.id)+'">Remove</button>':'')+'</article>';}).join('');
 const savedHtml=renderRows(savedRows.data||[],true),recentHtml=renderRows(viewRows.data||[],false);
 modal('Your PhoneLanka activity','<div class="pl-tabs"><button class="pl-tab active" id="plSavedTab">Saved ('+(savedRows.data||[]).length+')</button><button class="pl-tab" id="plRecentTab">Recently viewed ('+(viewRows.data||[]).length+')</button></div><div id="plActivityRows">'+(savedHtml||'<p class="pl-muted">You have not saved any live phones yet.</p>')+'</div>');
 const rowsHost=$('plActivityRows'),savedTab=$('plSavedTab'),recentTab=$('plRecentTab');
 savedTab.onclick=()=>{savedTab.classList.add('active');recentTab.classList.remove('active');rowsHost.innerHTML=savedHtml||'<p class="pl-muted">You have not saved any live phones yet.</p>';wireRemove();};
 recentTab.onclick=()=>{recentTab.classList.add('active');savedTab.classList.remove('active');rowsHost.innerHTML=recentHtml||'<p class="pl-muted">No recently viewed phones yet.</p>';};
 function wireRemove(){rowsHost.querySelectorAll('[data-pl-remove]').forEach(b=>b.onclick=async()=>{const d=await db.from('saved_phones').delete().eq('id',b.dataset.plRemove);if(d.error)alert(d.error.message);else showSavedDashboard();});}
 wireRemove();
}
const savedButton=$('savedBtn');if(savedButton)savedButton.onclick=()=>showSavedDashboard().catch(e=>alert(e.message));
const originalShop=window.showShop;
if(typeof originalShop==='function')window.showShop=function(name){
 originalShop(name);
 db.from('seller_shops').select('id').eq('shop_name',name).eq('status','active').maybeSingle().then(async r=>{
  if(r.error||!r.data)return;activeShopId=r.data.id;activeListingId=null;recordAnalytics(activeShopId,null,'shop_view');
  const host=$('modalContent');if(!host||host.querySelector('.pl-shop-reviews'))return;
  const reviews=await db.from('shop_reviews').select('id,rating,review_text,seller_response,created_at').eq('shop_id',activeShopId).eq('status','published').order('created_at',{ascending:false}).limit(10);
  const section=document.createElement('section');section.className='pl-shop-reviews';section.style.cssText='border-top:1px solid #dce4ef;margin-top:18px;padding-top:16px';
  section.innerHTML='<h3>Buyer reviews</h3>'+(reviews.error?'':(reviews.data||[]).map(x=>'<article style="padding:10px 0;border-bottom:1px solid #e5ebf3"><b>'+esc(x.rating)+'/5</b><p>'+esc(x.review_text||'')+'</p>'+(x.seller_response?'<p class="notice"><b>Seller response:</b> '+esc(x.seller_response)+'</p>':'')+'</article>').join('')||'<p class="pl-muted">No published reviews yet.</p>')+'<h4>Leave a review</h4><form id="plShopReviewForm"><div class="formrow"><label>Rating</label><select name="rating" required><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select></div><div class="formrow"><label>Your experience</label><textarea name="review_text" rows="3" maxlength="1200" placeholder="Share a helpful, honest review"></textarea></div><button class="btn primary">Submit review</button><p class="pl-muted" id="plReviewStatus">Reviews are checked by PhoneLanka before publication.</p></form>';
  host.appendChild(section);
  const form=$('plShopReviewForm');form.onsubmit=async e=>{e.preventDefault();if(!await requireUser(()=>form.requestSubmit()))return;const v=new FormData(form);const ins=await db.from('shop_reviews').insert({shop_id:activeShopId,reviewer_id:currentUser.id,rating:Number(v.get('rating')),review_text:String(v.get('review_text')||'').trim(),status:'pending'});if(ins.error){$('plReviewStatus').textContent=ins.error.message;return;}$('plReviewStatus').textContent='Review submitted. It will appear after moderation.';form.querySelector('button').disabled=true;};
 });
};
document.addEventListener('click',e=>{const a=e.target.closest('a[href*="wa.me/"]');if(a&&activeShopId)recordAnalytics(activeShopId,activeListingId,'whatsapp_click');});

db.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;if(currentUser)loadSaved();});
refreshUser().then(async u=>{if(u)await loadSaved();addNotificationButton();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addNotificationButton);else addNotificationButton();
})();
