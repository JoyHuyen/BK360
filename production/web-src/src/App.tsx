import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { api, setToken } from './api';
import type { Campaign, Lang, Location, Project, Screen, User } from './types';
import Welcome from './screens/Welcome';
import Map2D from './screens/Map2D';
import EventScreen from './screens/Event';
// VR360 kéo theo three.js (~600KB) và Admin chỉ dành cho quản trị → tách chunk, tải khi cần.
const VR360 = lazy(() => import('./screens/VR360'));
const Admin = lazy(() => import('./screens/Admin'));

const Loader = () => (
  <div className="screen show fatal">
    <div style={{ color: '#aecbe8' }}>Đang tải…</div>
  </div>
);

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [lang, setLang] = useState<Lang>('vi');
  const [locations, setLocations] = useState<Location[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadPublic = useCallback(async () => {
    try {
      const [locs, camps, proj] = await Promise.all([api.locations(), api.campaigns(), api.project().catch(() => null)]);
      setLocations(locs);
      setCampaigns(camps);
      setProject(proj);
      setErr(null);
    } catch (e: any) {
      setErr(e.message || 'Không tải được dữ liệu từ API');
    }
  }, []);

  useEffect(() => {
    loadPublic();
    // khôi phục phiên admin nếu còn refresh cookie
    api
      .refresh()
      .then((r) => {
        setToken(r.accessToken);
        setUser(r.user);
      })
      .catch(() => {});
  }, [loadPublic]);

  if (err) {
    return (
      <div className="screen show fatal">
        <div>
          <h2>Không kết nối được API</h2>
          <p>{err}</p>
          <button className="aprim" onClick={loadPublic}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === 'welcome' && (
        <Welcome
          lang={lang}
          setLang={setLang}
          enabledCampaigns={campaigns.length}
          isAdmin={!!user}
          onGo={setScreen}
        />
      )}
      {screen === 'map2d' && <Map2D locations={locations} lang={lang} mapBg={project?.mapBg} onBack={() => setScreen('welcome')} />}
      {screen === 'event' && (
        <EventScreen campaigns={campaigns} locations={locations} lang={lang} mapBg={project?.mapBg} onBack={() => setScreen('welcome')} />
      )}
      <Suspense fallback={<Loader />}>
        {screen === 'vr360' && <VR360 locations={locations} lang={lang} onBack={() => setScreen('welcome')} />}
        {screen === 'admin' && (
          <Admin lang={lang} user={user} setUser={setUser} onBack={() => setScreen('welcome')} reloadPublic={loadPublic} />
        )}
      </Suspense>
    </>
  );
}
