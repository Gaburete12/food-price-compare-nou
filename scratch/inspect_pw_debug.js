import fs from 'fs';

const html1 = fs.readFileSync('scratch/debug_pw_mesopotamia-constanta.html', 'utf8');
const html2 = fs.readFileSync('scratch/debug_pw_tacoseria-constanta.html', 'utf8');

console.log("Mesopotamia PW HTML contains Captcha?", html1.includes('captcha') || html1.includes('Captcha') || html1.includes('dd-captcha'));
console.log("Mesopotamia PW HTML contains Access Denied?", html1.includes('Access Denied') || html1.includes('access denied'));
console.log("Mesopotamia PW HTML Title:", html1.match(/<title>([\s\S]*?)<\/title>/)?.[1]);

console.log("Tacoseria PW HTML Title:", html2.match(/<title>([\s\S]*?)<\/title>/)?.[1]);

// Let's print first 1000 characters of Mesopotamia text
const text = html1.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
console.log("Mesopotamia text snippet:", text.slice(0, 1000));
