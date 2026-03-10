import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Header } from './components/Header';
import { ViewToggle } from './components/ViewToggle';
import { Chart } from './components/Chart';
import { Footer } from './components/Footer';
import { EditToggle } from './components/EditToggle';
import { TeamManagerButton } from './components/TeamManager';
import { ImportButton } from './components/ImportModal';
import { LoginPage } from './components/LoginPage';
import { useContributorData } from './hooks/useContributorData';

function AppInner() {
  const [view, setView] = useState<'people' | 'teams'>('people');
  const { isLoading, storedPeople, teams, gitIdentities, lastUpdated } = useEditor();
  const { totalContributors, totalCommits, topCommits } = useContributorData(storedPeople, teams, gitIdentities);

  if (isLoading) {
    return (
      <div className='app'>
        <div className='scanline' />
        <div className='loadingScreen'>
          <span className='loadingText'>connecting<span className='loadingDots'>...</span></span>
        </div>
      </div>
    );
  }

  return (
    <div className='app'>
      <div className='scanline' />
      <div className='container'>
        <Header totalContributors={totalContributors} totalCommits={totalCommits} topCommits={topCommits} lastUpdated={lastUpdated} />
        <div className='toolbar'>
          <ViewToggle view={view} onChange={setView} />
          <div className='toolbarRight'>
            <ImportButton />
            <TeamManagerButton />
            <EditToggle />
          </div>
        </div>
        <Chart view={view} />
        <Footer />
      </div>
    </div>
  );
}

const ALLOWED_DOMAIN = 'chyron.com';

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [domainError, setDomainError] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !session.user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        supabase.auth.signOut();
        setDomainError(true);
        setSession(null);
      } else {
        setDomainError(false);
        setSession(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className='app'>
        <div className='scanline' />
        <div className='loadingScreen'>
          <span className='loadingText'>connecting<span className='loadingDots'>...</span></span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage domainError={domainError} />;
  }

  return (
    <EditorProvider>
      <AppInner />
    </EditorProvider>
  );
}

export default App;
