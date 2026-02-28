import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import { supabase } from './src/db/index.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage })

// --- API ROUTES ---

// Auth
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const trimmedUsername = username?.trim();
  const trimmedPassword = password?.trim();

  console.log(`[AUTH] Login attempt for user: "${trimmedUsername}" (pwd length: ${trimmedPassword?.length || 0})`);

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('username', trimmedUsername)
    .eq('password', trimmedPassword)
    .single();

  if (user) {
    console.log(`[AUTH] Success: ${trimmedUsername}`);
    res.json(user);
  } else {
    console.log(`[AUTH] Failure for ${trimmedUsername}: ${error?.message || 'Invalid credentials'}`);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Temporary Reset Admin (for emergency access)
app.post('/api/reset-admin', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: 1, username: 'admin', password: 'admin123', role: 'admin' }, { onConflict: 'username' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Admin account reset successfully', user: data });
});

// Update user credentials
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, currentPassword } = req.body;

  // Verify current password first
  const { data: existing } = await supabase
    .from('users')
    .select('password')
    .eq('id', id)
    .single();

  if (!existing || existing.password !== currentPassword) {
    return res.status(401).json({ error: 'Senha atual incorreta.' });
  }

  const updates: any = {};
  if (username) updates.username = username;
  if (password) updates.password = password;

  const { error } = await supabase.from('users').update(updates).eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Attendees
app.get('/api/attendees', async (req, res) => {
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
    .select('id')
    .single();

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

  // Due to ON DELETE CASCADE on the tables, we only need to delete the attendee
  const { error } = await supabase.from('attendees').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Public Attendee Status by CPF
app.get('/api/public/status/:cpf', async (req, res) => {
  const { cpf } = req.params;
  // Normalize: strip all non-digit characters for comparison
  const cpfDigits = cpf.replace(/\D/g, '');

  // Try exact match first, then digits-only match
  let { data: attendee } = await supabase
    .from('attendees')
    .select('id, name, cpf, payment_status')
    .eq('cpf', cpf)
    .single();

  if (!attendee) {
    // Try matching by digits stripped from stored CPF using ilike fallback
    const { data: all } = await supabase
      .from('attendees')
      .select('id, name, cpf, payment_status');

    if (all) {
      attendee = all.find((a: any) => a.cpf.replace(/\D/g, '') === cpfDigits) || null;
    }
  }

  if (attendee) {
    res.json(attendee);
  } else {
    res.status(404).json({ error: 'Inscrito não encontrado' });
  }
});

// Attendance
app.get('/api/attendance', async (req, res) => {
  const { date, theme_id } = req.query;
  let query = supabase.from('attendance').select('*');

  if (date) query = query.eq('date', date);
  if (theme_id) query = query.eq('theme_id', theme_id);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/attendance', async (req, res) => {
  const { date, theme_id, records, finalized } = req.body;
  try {
    const upserts = records.map((record: any) => ({
      attendee_id: record.attendee_id,
      date,
      theme_id,
      present: record.present ? 1 : 0,
      finalized: finalized ? 1 : 0
    }));

    // In Supabase, if we are doing upsert where conflicts occur, we need unique constraint.
    // However, since we don't have constraints here besides Primary Key, we delete and reinsert.
    for (const record of records) {
      await supabase.from('attendance')
        .delete()
        .eq('attendee_id', record.attendee_id)
        .eq('date', date)
        .eq('theme_id', theme_id);
    }

    const { error } = await supabase.from('attendance').insert(upserts);
    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Justifications
app.get('/api/justifications', async (req, res) => {
  const { data, error } = await supabase
    .from('justifications')
    .select(`
      *,
      attendees (name),
      themes (title)
    `)
    .order('date', { ascending: false })
    .order('id', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const mapped = data.map((j: any) => ({
    ...j,
    attendee_name: j.attendees?.name,
    theme_title: j.themes?.title
  }));
  res.json(mapped);
});

app.post('/api/justifications', async (req, res) => {
  const { attendee_id, theme_id, date, reason } = req.body;
  const { data, error } = await supabase
    .from('justifications')
    .insert([{ attendee_id, theme_id, date, reason }])
    .select('id')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id });
});

app.delete('/api/justifications/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('justifications').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Financial
app.get('/api/financial', async (req, res) => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select(`
      *,
      attendees (name)
    `)
    .order('date', { ascending: false })
    .order('id', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const mapped = data.map((t: any) => ({
    ...t,
    attendee_name: t.attendees?.name
  }));
  res.json(mapped);
});

app.post('/api/financial', async (req, res) => {
  const { type, category, amount, date, description, attendee_id, is_exempt } = req.body;

  const { data, error } = await supabase
    .from('financial_transactions')
    .insert([{ type, category, amount, date, description, attendee_id: attendee_id || null }])
    .select('id')
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // If it's an income linked to an attendee, update their payment status
  if (type === 'income' && attendee_id) {
    const status = is_exempt ? 'exempt' : 'paid';
    await supabase.from('attendees').update({ payment_status: status }).eq('id', attendee_id);
  }

  res.json({ id: data.id });
});

app.delete('/api/financial/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Themes
app.get('/api/themes', async (req, res) => {
  const { data, error } = await supabase.from('themes').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/themes', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const { title, speaker, event_date } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const uploadedFile = files?.['file']?.[0];
  const coverFile = files?.['cover']?.[0];

  if (!uploadedFile) return res.status(400).json({ error: 'Arquivo principal obrigatório.' });

  const detectedType = uploadedFile.mimetype || 'application/octet-stream';

  const insertData: any = {
    title,
    speaker: speaker || null,
    event_date: event_date || null,
    file_type: detectedType,
    file_url: `/uploads/${uploadedFile.filename}`,
  };
  if (coverFile) insertData.cover_image_url = `/uploads/${coverFile.filename}`;

  let { data, error } = await supabase
    .from('themes')
    .insert([insertData])
    .select('id')
    .single();

  // Fallback: if cover_image_url column doesn't exist yet, retry without it
  if (error && insertData.cover_image_url) {
    console.warn('cover_image_url column may not exist, retrying without it:', error.message);
    const fallbackData = { ...insertData };
    delete fallbackData.cover_image_url;
    const retry = await supabase.from('themes').insert([fallbackData]).select('id').single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('THEME INSERT ERROR:', JSON.stringify(error));
    return res.status(400).json({ error: error.message, details: error });
  }
  res.json({ id: data!.id });
});

app.put('/api/themes/:id', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const { title, speaker, event_date, file_url } = req.body;
  const { id } = req.params;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const uploadedFile = files?.['file']?.[0];
  const coverFile = files?.['cover']?.[0];

  const updateData: any = { title, speaker: speaker || null, event_date: event_date || null };
  if (uploadedFile) {
    updateData.file_url = `/uploads/${uploadedFile.filename}`;
    updateData.file_type = uploadedFile.mimetype;
  } else if (file_url) {
    updateData.file_url = file_url;
  }
  if (coverFile) updateData.cover_image_url = `/uploads/${coverFile.filename}`;

  const { error } = await supabase
    .from('themes')
    .update(updateData)
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/themes/:id', async (req, res) => {
  const { id } = req.params;

  // Get theme to delete file if exists
  const { data: theme } = await supabase.from('themes').select('file_url').eq('id', id).single();

  if (theme && theme.file_url && theme.file_url.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, theme.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  const { error } = await supabase.from('themes').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const { count: totalAttendees } = await supabase.from('attendees').select('*', { count: 'exact', head: true });
    const { count: paidAttendees } = await supabase.from('attendees').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid');

    const { data: incomeData } = await supabase.from('financial_transactions').select('amount').eq('type', 'income');
    const { data: expenseData } = await supabase.from('financial_transactions').select('amount').eq('type', 'expense');

    const income = incomeData?.reduce((acc: number, item: any) => acc + item.amount, 0) || 0;
    const expense = expenseData?.reduce((acc: number, item: any) => acc + item.amount, 0) || 0;

    const { data: attendeesWithRoles } = await supabase.from('attendees').select('roles');
    const roleCounts: Record<string, number> = {};

    if (attendeesWithRoles) {
      attendeesWithRoles.forEach((row: any) => {
        try {
          const roles = JSON.parse(row.roles);
          if (Array.isArray(roles)) {
            roles.forEach((r: string) => {
              roleCounts[r] = (roleCounts[r] || 0) + 1;
            });
          }
        } catch (e) { }
      });
    }

    res.json({
      totalAttendees: totalAttendees || 0,
      paidAttendees: paidAttendees || 0,
      totalIncome: income,
      totalExpense: expense,
      roleCounts
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
