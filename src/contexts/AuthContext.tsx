import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    credits: number;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);

    const refreshCredits = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Profile doesn't exist, create it with 2 credits
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .upsert({ id: user.id, credits: 2, email: user.email })
                        .select()
                        .single();

                    if (createError) throw createError;
                    setCredits(newProfile.credits);
                } else if (error.message?.includes('Not Acceptable') || error.code === 'PGRST102') {
                    console.error('CRITICAL: The "credits" column seems to be missing in your "profiles" table. Please run the SQL script provided in the walkthrough.');
                    setCredits(0);
                } else {
                    throw error;
                }
            } else {
                setCredits(data?.credits ?? 0);
            }
        } catch (error) {
            console.error('Error refreshing credits:', error);
        }
    };

    useEffect(() => {
        if (user) {
            refreshCredits();
        }
    }, [user]);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes on auth state (signed in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/videoprompt`
            }
        });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setCredits(0);
    };

    const value = {
        user,
        session,
        loading,
        credits,
        signInWithGoogle,
        signOut,
        refreshCredits,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
