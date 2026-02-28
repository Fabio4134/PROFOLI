import express from 'express';
import cors from 'cors';
import multer from 'multer';
import 'dotenv/config';
import { supabase } from '../src/db/index.js';

const app = express();
app.use(cors());
app.use(express.json());

// Use memory storage for Vercel (files stored in buffer, uploaded to Supabase Storage)
const upload = multer({ storage: multer.memoryStorage() });

// Helper: upload buffer to Supabase Storage and return public URL
async function uploadToSupabase(buffer: Buffer, originalName: string, mimetype: string, bucket = 'uploads'): Promise<string> {
    const ext = originalName.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

    const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, { contentType: mimetype, upsert: false });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();

    const { data: user } = await supabase
        .from('users')
        .select('id, username, role')
        .eq('username', trimmedUsername)
        .eq('password', trimmedPassword)
        .single();
    if (user) res.json(user);
    else res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/reset-admin', async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .upsert({ id: 1, username: 'admin', password: 'admin123', role: 'admin' }, { onConflict: 'username' })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Admin account reset successfully', user: data });
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, currentPassword } = req.body;
    const { data: existing } = await supabase.from('users').select('password').eq('id', id).single();
    if (!existing || existing.password !== currentPassword)
        return res.status(401).json({ error: 'Senha atual incorreta.' });
    const updates: any = {};
    if (username) updates.username = username;
    if (password) updates.password = password;
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// ─── ATTENDEES ───────────────────────────────────────────────────────────────

app.get('/api/attendees', async (_req, res) => {
    const { data, error } = await supabase.from('attendees').select('*').order('name');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/api/attendees', async (req, res) => {
    const { name, cpf, roles, church, phone } = req.body;
    const cpfDigits = cpf.replace(/\D/g, '');

    // Check for duplicate CPF
    const { data: existing } = await supabase
        .from('attendees')
        .select('id')
        .eq('cpf', cpfDigits)
        .single();

    if (existing) {
        return res.status(400).json({ error: 'Este CPF já está cadastrado no sistema.' });
    }

    const { data, error } = await supabase
        .from('attendees')
        .insert([{ name, cpf: cpfDigits, roles: JSON.stringify(roles), church, phone }])
        .select('id').single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ id: data.id });
});

app.put('/api/attendees/:id', async (req, res) => {
    const { name, cpf, roles, church, phone, status, payment_status } = req.body;
    const { id } = req.params;
    const cpfDigits = cpf ? cpf.replace(/\D/g, '') : undefined;

    if (cpfDigits) {
        // Check if another attendee has this CPF
        const { data: existing } = await supabase
            .from('attendees')
            .select('id')
            .eq('cpf', cpfDigits)
            .neq('id', id)
            .single();
        if (existing) return res.status(400).json({ error: 'Este CPF já pertence a outro inscrito.' });
    }

    const { error } = await supabase
        .from('attendees')
        .update({ name, cpf: cpfDigits, roles: JSON.stringify(roles), church, phone, status, payment_status })
        .eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

app.delete('/api/attendees/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('attendees').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// ─── PUBLIC STATUS ────────────────────────────────────────────────────────────

app.get('/api/public/status/:cpf', async (req, res) => {
    const cpfDigits = req.params.cpf.replace(/\D/g, '');
    let { data: attendee } = await supabase
        .from('attendees').select('id, name, cpf, payment_status').eq('cpf', req.params.cpf).single();
    if (!attendee) {
        const { data: all } = await supabase.from('attendees').select('id, name, cpf, payment_status');
        attendee = all?.find((a: any) => a.cpf.replace(/\D/g, '') === cpfDigits) || null;
    }
    if (attendee) res.json(attendee);
    else res.status(404).json({ error: 'Inscrito não encontrado' });
});

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

app.get('/api/attendance', async (req, res) => {
    const { date, theme_id } = req.query;
    let query = supabase.from('attendance').select('*');
    if (date) query = query.eq('date', date as string);
    if (theme_id) query = query.eq('theme_id', theme_id as string);
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/api/attendance', async (req, res) => {
    const { date, theme_id, records, finalized } = req.body;
    try {
        for (const record of records) {
            await supabase.from('attendance')
                .delete().eq('attendee_id', record.attendee_id).eq('date', date).eq('theme_id', theme_id);
        }
        const upserts = records.map((r: any) => ({
            attendee_id: r.attendee_id, date, theme_id,
            present: r.present ? 1 : 0, finalized: finalized ? 1 : 0
        }));
        const { error } = await supabase.from('attendance').insert(upserts);
        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// ─── JUSTIFICATIONS ───────────────────────────────────────────────────────────

app.get('/api/justifications', async (_req, res) => {
    const { data, error } = await supabase
        .from('justifications')
        .select('*, attendees (name), themes (title)')
        .order('date', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data.map((j: any) => ({ ...j, attendee_name: j.attendees?.name, theme_title: j.themes?.title })));
});

app.post('/api/justifications', async (req, res) => {
    const { attendee_id, theme_id, date, reason } = req.body;
    const { data, error } = await supabase.from('justifications')
        .insert([{ attendee_id, theme_id, date, reason }]).select('id').single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ id: data.id });
});

app.delete('/api/justifications/:id', async (req, res) => {
    const { error } = await supabase.from('justifications').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// ─── FINANCIAL ────────────────────────────────────────────────────────────────

app.get('/api/financial', async (_req, res) => {
    const { data, error } = await supabase
        .from('financial_transactions')
        .select('*, attendees (name)')
        .order('date', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data.map((t: any) => ({ ...t, attendee_name: t.attendees?.name })));
});

app.post('/api/financial', async (req, res) => {
    const { type, category, amount, date, description, attendee_id, is_exempt } = req.body;
    const { data, error } = await supabase
        .from('financial_transactions')
        .insert([{ type, category, amount, date, description, attendee_id: attendee_id || null }])
        .select('id').single();
    if (error) return res.status(400).json({ error: error.message });
    if (type === 'income' && attendee_id) {
        await supabase.from('attendees').update({ payment_status: is_exempt ? 'exempt' : 'paid' }).eq('id', attendee_id);
    }
    res.json({ id: data.id });
});

app.delete('/api/financial/:id', async (req, res) => {
    const { error } = await supabase.from('financial_transactions').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// ─── THEMES ───────────────────────────────────────────────────────────────────

app.get('/api/themes', async (_req, res) => {
    const { data, error } = await supabase.from('themes').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/api/themes',
    upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
    async (req, res) => {
        const { title, speaker, event_date } = req.body;
        const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;
        const mainFile = files?.['file']?.[0];
        const coverFile = files?.['cover']?.[0];

        if (!mainFile) return res.status(400).json({ error: 'Arquivo principal obrigatório.' });

        try {
            const fileUrl = await uploadToSupabase(mainFile.buffer, mainFile.originalname, mainFile.mimetype);
            const insertData: any = {
                title, speaker: speaker || null, event_date: event_date || null,
                file_type: mainFile.mimetype, file_url: fileUrl,
            };
            if (coverFile) {
                try { insertData.cover_image_url = await uploadToSupabase(coverFile.buffer, coverFile.originalname, coverFile.mimetype); }
                catch { /* cover column may not exist, ignore */ }
            }

            let { data, error } = await supabase.from('themes').insert([insertData]).select('id').single();
            if (error && insertData.cover_image_url) {
                const fallback = { ...insertData }; delete fallback.cover_image_url;
                const retry = await supabase.from('themes').insert([fallback]).select('id').single();
                data = retry.data; error = retry.error;
            }
            if (error) return res.status(400).json({ error: error.message });
            res.json({ id: data!.id });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);

app.put('/api/themes/:id',
    upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
    async (req, res) => {
        const { title, speaker, event_date, file_url } = req.body;
        const { id } = req.params;
        const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;
        const mainFile = files?.['file']?.[0];
        const coverFile = files?.['cover']?.[0];

        const updateData: any = { title, speaker: speaker || null, event_date: event_date || null };
        try {
            if (mainFile) {
                updateData.file_url = await uploadToSupabase(mainFile.buffer, mainFile.originalname, mainFile.mimetype);
                updateData.file_type = mainFile.mimetype;
            } else if (file_url) {
                updateData.file_url = file_url;
            }
            if (coverFile) {
                try { updateData.cover_image_url = await uploadToSupabase(coverFile.buffer, coverFile.originalname, coverFile.mimetype); }
                catch { /* ignore */ }
            }
            const { error } = await supabase.from('themes').update(updateData).eq('id', id);
            if (error) return res.status(400).json({ error: error.message });
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);

app.delete('/api/themes/:id', async (req, res) => {
    const { error } = await supabase.from('themes').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// ─── STATS ────────────────────────────────────────────────────────────────────

app.get('/api/stats', async (_req, res) => {
    try {
        const { count: totalAttendees } = await supabase.from('attendees').select('*', { count: 'exact', head: true });
        const { count: paidAttendees } = await supabase.from('attendees').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid');
        const { data: incomeData } = await supabase.from('financial_transactions').select('amount').eq('type', 'income');
        const { data: expenseData } = await supabase.from('financial_transactions').select('amount').eq('type', 'expense');
        const income = incomeData?.reduce((acc: number, i: any) => acc + i.amount, 0) || 0;
        const expense = expenseData?.reduce((acc: number, i: any) => acc + i.amount, 0) || 0;
        const { data: attendeesWithRoles } = await supabase.from('attendees').select('roles');
        const roleCounts: Record<string, number> = {};
        attendeesWithRoles?.forEach((row: any) => {
            try { JSON.parse(row.roles).forEach((r: string) => { roleCounts[r] = (roleCounts[r] || 0) + 1; }); } catch { }
        });
        res.json({ totalAttendees: totalAttendees || 0, paidAttendees: paidAttendees || 0, totalIncome: income, totalExpense: expense, roleCounts });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Vercel serverless export
export default app;
