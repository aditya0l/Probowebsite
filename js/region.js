// Regional sales desks. The visitor's state picks the desk every call, WhatsApp and form goes to.
const $$ = s => [...document.querySelectorAll(s)];
export const DESKS = { a: { num: '917891712345', show: '+91 78917 12345', area: 'Rest of India' }, n: { num: '919403893899', show: '+91 94038 93899', area: 'Delhi NCR, Gujarat, Punjab, Haryana and Tamil Nadu' }, s: { num: '919403893399', show: '+91 94038 93399', area: 'Maharashtra, Uttar Pradesh and Bangalore' } };
export const STATES = [['Rajasthan', 'a'], ['Delhi NCR', 'n'], ['Gujarat', 'n'], ['Punjab', 'n'], ['Haryana', 'n'], ['Tamil Nadu', 'n'], ['Maharashtra', 's'], ['Uttar Pradesh', 's'], ['Karnataka', 's'], ['Madhya Pradesh', 'a'], ['West Bengal', 'a'], ['Telangana', 'a'], ['Andhra Pradesh', 'a'], ['Kerala', 'a'], ['Bihar', 'a'], ['Odisha', 'a'], ['Assam', 'a'], ['Other', 'a']];
let region = 'Rajasthan'; try { region = localStorage.getItem('pbl-region') || region; } catch (e) { }
const listeners = [];
export const getRegion = () => region;
export const desk = () => DESKS[(STATES.find(s => s[0] === region) || STATES[0])[1]];
export const waLink = text => `https://wa.me/${desk().num}?text=${encodeURIComponent(text)}`;
export const onRegion = f => listeners.push(f);
export function setRegion(r) {
  region = r; try { localStorage.setItem('pbl-region', r); } catch (e) { }
  $$('select[data-region]').forEach(s => s.value = r);
  $$('[data-desk]').forEach(el => el.textContent = `${desk().show} (${desk().area})`);
  $$('[data-desk-link]').forEach(a => a.href = 'tel:+' + desk().num);
  $$('#abWa').forEach(a => a.href = waLink('Hi Probodyline, I have a question.'));
  listeners.forEach(f => f());
}
$$('select[data-region]').forEach(s => { STATES.forEach(([n]) => s.add(new Option(n, n))); s.addEventListener('change', () => setRegion(s.value)); });
setRegion(region);
