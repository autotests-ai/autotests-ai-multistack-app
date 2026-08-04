import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Panel } from '@zero-design-system/react';
import { fetchHealth, fetchItems, type Item } from '../lib/api';
import { clearSession, fetchProfile, getToken, logout } from '../lib/auth';

type HealthState = { text: string; error: boolean };
type ItemsState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'loaded'; items: Item[] }
  | { status: 'error'; message: string };

export function HomePage() {
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthState>({ text: '→ Checking health…', error: false });
  const [items, setItems] = useState<ItemsState>({ status: 'loading' });
  const [welcome, setWelcome] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchHealth()
      .then((payload) => {
        if (active) {
          setHealth({ text: `→ ${payload.status} | service: ${payload.service}`, error: false });
        }
      })
      .catch((error: Error) => {
        if (active) {
          setHealth({ text: `✗ health: ${error.message}`, error: true });
        }
      });

    fetchItems()
      .then((payload) => {
        if (!active) return;
        const list = payload.items ?? [];
        setItems(list.length ? { status: 'loaded', items: list } : { status: 'empty' });
      })
      .catch((error: Error) => {
        if (active) {
          setItems({ status: 'error', message: error.message });
        }
      });

    if (getToken()) {
      fetchProfile()
        .then((profile) => {
          if (active) {
            setWelcome(`Welcome, ${profile.username}!`);
          }
        })
        .catch(() => {
          clearSession();
        });
    }

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main
      className="page-shell page-shell--below-header grid reference-app"
      data-testid="reference-layout"
    >
      <Panel title="Reference App">
        <p className="text text--muted">
          Spring Boot + React SPA — items loaded from <code>/api/items</code>.
        </p>
      </Panel>

      <Panel
        title="Session"
        testId="welcome-panel"
        hidden={welcome === null}
        bodyClassName="reference-app__welcome-body"
      >
        <p id="welcome-message" className="text" data-testid="welcome-message">
          {welcome}
        </p>
        <Button
          id="logout-button"
          variant="primary"
          data-testid="logout-button"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Panel>

      <Panel title="Health" testId="health-panel">
        <p
          className={
            health.error ? 'text text--sm text--muted reference-app__error' : 'text text--sm text--muted'
          }
          data-testid="health-status"
        >
          {health.text}
        </p>
      </Panel>

      <div className="grid" data-testid="items-list" aria-live="polite">
        {items.status === 'loading' && (
          <Panel title="Items">
            <p className="text text--muted">→ Loading items…</p>
          </Panel>
        )}
        {items.status === 'empty' && (
          <Panel title="Items">
            <p className="text text--muted">No items found.</p>
          </Panel>
        )}
        {items.status === 'error' && (
          <Panel title="Items">
            <p className="reference-app__error">✗ items: {items.message}</p>
          </Panel>
        )}
        {items.status === 'loaded' &&
          items.items.map((item) => (
            <Panel key={item.id} title={item.name} testId="item-row">
              <p className="text text--muted">{item.description}</p>
            </Panel>
          ))}
      </div>
    </main>
  );
}
