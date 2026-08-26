import { Button, Panel } from '@zero-design-system/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { fetchHealth, fetchItems } from '../lib/api';
import { UI_MOUNT } from '../lib/appBase';
import {
  clearSession,
  deleteAccount,
  fetchProfile,
  formatMessage,
  getToken,
  logout,
} from '../lib/auth';

function Blurb({ template }) {
  const [before, after] = template.split('{api}');
  return (
    <p className="text text--muted">
      {before}
      <code>/api/items</code>
      {after}
    </p>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { copy } = useI18n();
  const [health, setHealth] = useState({ status: 'checking' });
  const [items, setItems] = useState({ status: 'loading' });
  const [welcomeName, setWelcomeName] = useState(null);

  useEffect(() => {
    let active = true;

    fetchHealth()
      .then((payload) => {
        if (active) {
          setHealth({ status: 'ok', health: payload.status, service: payload.service });
        }
      })
      .catch((error) => {
        if (active) {
          setHealth({ status: 'error', message: error.message });
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
            setWelcomeName(profile.username);
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
    if (!window.confirm(copy.home.deleteConfirm)) {
      return;
    }
    await deleteAccount();
    navigate('/login');
  };

  const healthText =
    health.status === 'checking'
      ? copy.home.healthChecking
      : health.status === 'ok'
        ? formatMessage(copy.home.healthOk, {
            status: health.health,
            service: health.service,
            frontend: UI_MOUNT,
          })
        : formatMessage(copy.home.healthError, { message: health.message });

  return (
    <main
      className="page-shell page-shell--below-header grid multistack"
      data-testid="multistack-layout"
    >
      <Panel title={copy.home.title}>
        <Blurb template={copy.home.blurb} />
      </Panel>

      <Panel
        title={copy.home.session}
        testId="welcome-panel"
        hidden={welcomeName === null}
        bodyClassName="multistack__welcome-body"
      >
        <p id="welcome-message" className="text" data-testid="welcome-message">
          {welcomeName === null ? '' : formatMessage(copy.home.welcome, { username: welcomeName })}
        </p>
        <Button
          id="logout-button"
          variant="primary"
          data-testid="logout-button"
          onClick={handleLogout}
        >
          {copy.home.logout}
        </Button>
        <Button
          id="delete-account-button"
          variant="danger"
          data-testid="delete-account-button"
          onClick={handleDeleteAccount}
        >
          {copy.home.deleteAccount}
        </Button>
      </Panel>

      <Panel title={copy.home.health} testId="health-panel">
        <p
          className={
            health.status === 'error'
              ? 'text text--sm text--muted multistack__error'
              : 'text text--sm text--muted'
          }
          data-testid="health-status"
        >
          {healthText}
        </p>
      </Panel>

      <div className="grid" data-testid="items-list" aria-live="polite">
        {items.status === 'loading' && (
          <Panel title={copy.home.items}>
            <p className="text text--muted">{copy.home.itemsLoading}</p>
          </Panel>
        )}
        {items.status === 'empty' && (
          <Panel title={copy.home.items}>
            <p className="text text--muted">{copy.home.itemsEmpty}</p>
          </Panel>
        )}
        {items.status === 'error' && (
          <Panel title={copy.home.items}>
            <p className="multistack__error">
              {formatMessage(copy.home.itemsError, { message: items.message })}
            </p>
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
