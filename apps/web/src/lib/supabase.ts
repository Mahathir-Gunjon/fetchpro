import { createClient } from '@supabase/supabase-js';
import { Lead, DashboardStats } from './types';
import { INITIAL_MOCK_LEADS, SAMPLE_DEMO_LEADS } from './mock-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey || supabaseAnonKey!)
  : null;

let inMemoryLeads: Lead[] = [...INITIAL_MOCK_LEADS];

export async function dbGetLeads(): Promise<Lead[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Lead[];
      }
    } catch (err) {
      console.warn('[Supabase Fallback] Using memory store:', err);
    }
  }

  return inMemoryLeads;
}

export async function dbGetLeadById(id: string): Promise<Lead | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as Lead;
      }
    } catch (err) {
      console.warn('[Supabase Fallback] dbGetLeadById error:', err);
    }
  }

  return inMemoryLeads.find((l) => l.id === id) || null;
}

export async function dbCreateLead(leadData: Partial<Lead>): Promise<Lead> {
  const newLead: Lead = {
    id: leadData.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
    business_name: leadData.business_name || 'Unnamed Business',
    phone: leadData.phone || null,
    rating: leadData.rating || 0,
    reviews_count: leadData.reviews_count || 0,
    category: leadData.category || null,
    address: leadData.address || null,
    maps_url: leadData.maps_url || null,
    gmb_website_url: leadData.gmb_website_url || null,
    website_url: leadData.website_url || null,
    discovered_website: leadData.discovered_website || null,
    web_results_links: leadData.web_results_links || null,
    email: leadData.email || null,
    socials: leadData.socials || null,
    social_profiles: leadData.social_profiles || leadData.socials || null,
    is_qualified: leadData.is_qualified ?? false,
    opportunity_score: leadData.opportunity_score || null,
    opportunity_reasons: leadData.opportunity_reasons || null,
    qualification_log: leadData.qualification_log || null,
    status: leadData.status || 'pending',
    audit_data: leadData.audit_data || null,
    ai_pitch: leadData.ai_pitch || null,
    ai_subject: leadData.ai_subject || null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select()
        .single();

      if (!error && data) {
        return data as Lead;
      }
    } catch (err) {
      console.warn('[Supabase Fallback] dbCreateLead error:', err);
    }
  }

  inMemoryLeads.unshift(newLead);
  return newLead;
}

export async function dbBatchInsertLeads(leads: Partial<Lead>[]): Promise<Lead[]> {
  const formattedLeads: Lead[] = leads.map((l) => ({
    id: l.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
    business_name: l.business_name || 'Unnamed Business',
    phone: l.phone || null,
    rating: typeof l.rating === 'number' ? l.rating : 0,
    reviews_count: typeof l.reviews_count === 'number' ? l.reviews_count : 0,
    category: l.category || null,
    address: l.address || null,
    maps_url: l.maps_url || null,
    gmb_website_url: l.gmb_website_url || null,
    website_url: l.website_url || null,
    discovered_website: l.discovered_website || null,
    website_source: l.website_source || (l.gmb_website_url ? 'GMB_BUTTON' : (l.discovered_website || l.website_url ? 'WEB_RESULTS' : 'NONE')),
    web_results_links: l.web_results_links || null,
    email: l.email || null,
    socials: l.socials || null,
    social_profiles: l.social_profiles || l.socials || null,
    is_qualified: l.is_qualified ?? false,
    opportunity_score: l.opportunity_score || null,
    opportunity_reasons: l.opportunity_reasons || null,
    qualification_log: l.qualification_log || null,
    status: (l.status as any) || 'pending',
    audit_data: l.audit_data || null,
    ai_pitch: l.ai_pitch || null,
    ai_subject: l.ai_subject || null,
    created_at: new Date().toISOString(),
  }));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert(formattedLeads)
        .select();

      if (!error && data) {
        return data as Lead[];
      }
    } catch (err) {
      console.warn('[Supabase Fallback] dbBatchInsertLeads error:', err);
    }
  }

  inMemoryLeads = [...formattedLeads, ...inMemoryLeads];
  return formattedLeads;
}

export async function dbUpdateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const updatedFields = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Lead;
      }
    } catch (err) {
      console.warn('[Supabase Fallback] dbUpdateLead error:', err);
    }
  }

  const index = inMemoryLeads.findIndex((l) => l.id === id);
  if (index !== -1) {
    inMemoryLeads[index] = {
      ...inMemoryLeads[index],
      ...updatedFields,
    };
    return inMemoryLeads[index];
  }

  return null;
}

export async function dbDeleteLead(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('[Supabase Fallback] dbDeleteLead error:', err);
    }
  }

  const prevLen = inMemoryLeads.length;
  inMemoryLeads = inMemoryLeads.filter((l) => l.id !== id);
  return inMemoryLeads.length < prevLen;
}

export async function dbResetMockData(): Promise<Lead[]> {
  inMemoryLeads = [...SAMPLE_DEMO_LEADS];
  return inMemoryLeads;
}

export async function dbGetStats(): Promise<DashboardStats> {
  const leads = await dbGetLeads();
  const totalLeads = leads.length;
  const auditedLeads = leads.filter(
    (l) => l.status === 'audited' || l.status === 'emailed' || l.status === 'hot_lead' || l.status === 'trash' || !!l.audit_data
  ).length;
  const qualifiedLeadsCount = leads.filter(
    (l) => l.is_qualified === true || l.status === 'hot_lead' || (l.opportunity_score && l.opportunity_score >= 40)
  ).length;
  const hotLeadsCount = qualifiedLeadsCount;
  const trashLeadsCount = leads.filter((l) => l.status === 'trash').length;
  const emailsSent = leads.filter((l) => l.status === 'emailed').length;
  const leadsWithWebsites = leads.filter((l) => !!(l.website_url || l.gmb_website_url)).length;
  const leadsWithoutWebsites = leads.filter((l) => !l.website_url && !l.gmb_website_url).length;
  const leadsWithPhones = leads.filter((l) => !!l.phone).length;

  const scoredLeads = leads.filter((l) => l.audit_data?.healthScore !== undefined);
  const averageHealthScore = scoredLeads.length > 0
    ? Math.round(scoredLeads.reduce((acc, l) => acc + (l.audit_data?.healthScore || 0), 0) / scoredLeads.length)
    : 0;

  return {
    totalLeads,
    auditedLeads,
    qualifiedLeadsCount,
    hotLeadsCount,
    trashLeadsCount,
    averageHealthScore,
    emailsSent,
    leadsWithWebsites,
    leadsWithoutWebsites,
    leadsWithPhones,
  };
}
