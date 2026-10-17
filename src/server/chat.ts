import type { Request, Response } from 'express';

export const helpTopics = [
  { pattern: /patient code|patient id|find.*code/i, reply: 'Open your Patient Dashboard and look for “Your patient code” below the welcome card. Choose Copy patient code, then give it to your doctor so they can request access.' },
  { pattern: /revok|stop sharing|remove access/i, reply: 'Open Consents & Sharing, select Active Access, then choose Revoke Access on the relevant request. Confirm revocation. The doctor will lose access through that permission.' },
  { pattern: /expir|duration|minutes/i, reply: 'Sharing permissions are time-limited. You choose the duration when approving a request. Once it expires, your doctor needs a new request and your approval to access the records again.' },
  { pattern: /import|upload|pdf/i, reply: 'Choose Import Records in your patient menu. Enter the document details and paste the clinical text, then select Ingest & Run Discrepancy Check. The current importer works with text; it does not read a PDF file automatically. Fictional sample records are available for rehearsals.' },
  { pattern: /discrepanc|conflict|affirm/i, reply: 'Open Discrepancies to compare the original source statements. You can add your recollection and choose Affirm for Clinician. A doctor with approved access can review both sources and record a reconciliation. A flagged discrepancy is not a diagnosis.' },
  { pattern: /doctor|clinician|handoff/i, reply: 'Doctors sign in through the Clinical Team tab using a provisioned account. In Access Requests, enter the patient’s code and request the categories needed. The patient approves the request in Consents & Sharing; the doctor can then open the authorized handoff.' },
  { pattern: /consent|share|permission|qr/i, reply: 'Your doctor first sends an access request using your patient code. Open Consents & Sharing → Pending Requests → Approve. Review the categories, select a duration and choose Sign & Grant Access. You can share the handoff link or QR code with the assigned doctor.' },
  { pattern: /history|timeline|record|audit/i, reply: 'Medical History shows your imported records and source details. Use the provider, record-type and date-order filters to find an entry, then choose View Document. Access History shows recorded access and sharing events.' },
  { pattern: /sign.?in|log.?in|account|register|password/i, reply: 'Use Sign In on the home page. Patients can create an account or use Patient Sign In. Doctors use Clinical Team Sign In with an account provisioned by an administrator. Keep patient and doctor sessions in separate browser profiles when demonstrating both roles.' },
  { pattern: /^(hi|hello|hey|thanks|thank you)[!. ]*$/i, reply: 'Hello. I can help you find your patient code, import records, manage sharing, or understand the doctor handoff. What would you like to do?' }
];

export function seededReply(message: string): string | undefined {
  if (/chest pain|can.t breathe|overdose|emergency/i.test(message)) return 'If this may be a medical emergency, contact local emergency services now. This assistant provides MediLink navigation help and cannot assess urgent symptoms.';
  if (/diagnos|dosage|dose|should i take|treatment|symptom/i.test(message)) return 'I can explain how to use MediLink, but I cannot diagnose symptoms or recommend treatment or medication changes. Please discuss those questions with your clinician. You can use Discrepancies to share a note about conflicting records.';
  return helpTopics.find(topic => topic.pattern.test(message))?.reply;
}

const limits = new Map<string, { count: number; until: number }>();
const fallback = 'I can help with patient codes, importing records, sharing permissions, medical history, and doctor handoffs. Which part are you trying to use?';

export async function chatHandler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 12 || messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 1500) || messages.at(-1)?.role !== 'user') {
    res.status(400).json({ error: 'Please send a message of up to 1,500 characters.' }); return;
  }
  const now = Date.now();
  for (const [key, value] of limits) if (value.until < now) limits.delete(key);
  const ip = req.ip || 'unknown';
  const limit = limits.get(ip) || { count: 0, until: now + 60_000 };
  if (limit.count >= 15 || limits.size > 5000) { res.status(429).json({ error: 'Please wait a minute before sending another message.' }); return; }
  limit.count++; limits.set(ip, limit);
  const answer = seededReply(messages.at(-1).content);
  if (answer) { res.json({ reply: answer, source: 'guide' }); return; }
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || !req.body.useAI) { res.json({ reply: fallback, source: 'guide' }); return; }
  try {
    const model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are MediLink’s concise product support assistant. Only explain MediLink using this guide. You cannot access records, identify the signed-in person, change data, approve grants, or perform actions. Never claim you did. Do not diagnose, interpret medical records, prescribe or recommend treatment. If asked something outside the guide, say you do not know. Never invent features. Use plain text, no markdown. Guide: ' + helpTopics.map(t => t.reply).join('\n') }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 500, temperature: 0.2 }
      })
    });
    if (!response.ok) throw new Error('Provider unavailable');
    const result = await response.json();
    const reply = result.candidates?.[0]?.content?.parts?.filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text || '').join('').trim();
    if (!reply) throw new Error('Empty reply');
    res.json({ reply: reply.slice(0, 4000), source: 'gemini' });
  } catch { res.json({ reply: fallback, source: 'guide', fallback: true }); }
}
