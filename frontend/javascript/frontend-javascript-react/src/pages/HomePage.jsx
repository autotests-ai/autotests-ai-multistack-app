import { Button, Panel } from '@zero-design-system/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHealth, fetchItems } from '../lib/api';
import { UI_MOUNT } from '../lib/appBase';
import { clearSession, deleteAccount, fetchProfile, getToken, logout } from '../lib/auth';
import { DELETE_ACCOUNT_CONFIRM } from '../lib/messages';

export function HomePage() {
  const navigate = useNavigate();
  const [health, setHealth] = useState({ text: '→ Checking health…', error: false });
  const [items, setItems] = useState({ status: 'loading' });
  const [welcome, setWelcome] = useState(null);

  useEffect(() => {
    let active = true;

    fetchHealth()
      .then((payload) => {
        if (active) {
          setHealth({
            text: `→ ${payload.status} | service: ${payload.service} | frontend: ${UI_MOUNT}`,
            error: false,
          });
        }
      })
      .catch((error) => {
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
      .catch((error) => {
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
          if (active) {
            clearSession();
          }
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

  const handleDeleteAccount = async () => {
    if (!window.confirm(DELETE_ACCOUNT_CONFIRM)) {
      return;
    }
    await deleteAccount();
    navigate('/login');
  };

  return (
    <main
      className="page-shell page-shell--below-header grid reference-app"
      data-testid="reference-layout"
    >
      <Panel title="Reference App">
        <p className="text text--muted">
          JavaScript React SPA — items loaded from <code>/api/items</code>.
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
        <Button
          id="delete-account-button"
          variant="danger"
          data-testid="delete-account-button"
          onClick={handleDeleteAccount}
        >
          Delete account
        </Button>
      </Panel>

      <Panel title="Health" testId="health-panel">
        <p
          className={
            health.error
              ? 'text text--sm text--muted reference-app__error'
              : 'text text--sm text--muted'
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
