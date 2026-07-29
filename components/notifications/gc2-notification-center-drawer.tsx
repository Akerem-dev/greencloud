"use client";

import {
  Activity,
  BellRing,
  Check,
  CheckCheck,
  Inbox,
  Settings,
} from "lucide-react";

import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Status } from "@/components/ui/gc2-status";

function notificationMessage(description: string, body: string) {
  return description.trim() || body.trim() || "No notification detail was supplied.";
}

export default function Gc2NotificationCenterDrawer() {
  const {
    notifications,
    unreadNotifications,
    notificationsOpen,
    closeNotifications,
    markAllNotificationsRead,
    settings,
  } = useAppState();

  const notificationMode =
    settings.notificationMode === "all" ? "All notifications" : "Priority only";

  return (
    <Gc2Dialog
      open={notificationsOpen}
      onClose={closeNotifications}
      title="Notification center"
      description="Review the notification records already stored in this workspace. The drawer does not create, infer or delete notification evidence."
      variant="drawer"
      closeLabel="Close notification center"
      footer={
        <>
          <Gc2LinkButton href="/settings" variant="quiet" onClick={closeNotifications}>
            <Settings aria-hidden="true" className="h-4 w-4" />
            Notification settings
          </Gc2LinkButton>
          <Gc2LinkButton href="/activity" variant="secondary" onClick={closeNotifications}>
            <Activity aria-hidden="true" className="h-4 w-4" />
            Activity ledger
          </Gc2LinkButton>
          <Gc2Button
            variant="primary"
            onClick={markAllNotificationsRead}
            disabled={unreadNotifications === 0}
          >
            <CheckCheck aria-hidden="true" className="h-4 w-4" />
            Mark all read
          </Gc2Button>
        </>
      }
    >
      <div className="grid gap-5">
        <section
          aria-label="Notification summary"
          className="grid grid-cols-2 border-y border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] sm:grid-cols-3"
        >
          <div className="border-r border-[var(--gc2-line)] px-4 py-4">
            <p className="gc2-kicker">Unread</p>
            <p className="gc2-data mt-2 text-2xl font-bold text-[var(--gc2-ink)]">
              {unreadNotifications}
            </p>
          </div>
          <div className="px-4 py-4 sm:border-r sm:border-[var(--gc2-line)]">
            <p className="gc2-kicker">Stored records</p>
            <p className="gc2-data mt-2 text-2xl font-bold text-[var(--gc2-ink)]">
              {notifications.length}
            </p>
          </div>
          <div className="col-span-2 border-t border-[var(--gc2-line)] px-4 py-4 sm:col-span-1 sm:border-t-0">
            <p className="gc2-kicker">Delivery preference</p>
            <p className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
              {notificationMode}
            </p>
          </div>
        </section>

        {notifications.length > 0 ? (
          <section aria-label="Notification ledger" className="border-y border-[var(--gc2-line)]">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--gc2-line)] py-3">
              <div>
                <p className="gc2-kicker">Workspace records</p>
                <h3 className="mt-1 text-base font-bold text-[var(--gc2-ink)]">
                  Newest available notification evidence
                </h3>
              </div>
              <Gc2Status tone={unreadNotifications > 0 ? "warning" : "neutral"}>
                {unreadNotifications > 0 ? `${unreadNotifications} unread` : "All read"}
              </Gc2Status>
            </div>

            <div className="divide-y divide-[var(--gc2-line)]">
              {notifications.map((item) => {
                const message = notificationMessage(item.description, item.body);
                const hasDistinctBody = item.body.trim() && item.body.trim() !== message;

                return (
                  <article
                    key={item.id}
                    className="grid grid-cols-[36px_minmax(0,1fr)_auto] gap-3 py-4"
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-[var(--gc2-radius-md)] border ${
                        item.read
                          ? "border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-[var(--gc2-ink-muted)]"
                          : "border-[var(--gc2-warning)] bg-[var(--gc2-warning-soft)] text-[var(--gc2-warning)]"
                      }`}
                    >
                      {item.read ? (
                        <Check aria-hidden="true" className="h-4 w-4" />
                      ) : (
                        <BellRing aria-hidden="true" className="h-4 w-4" />
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                          {item.title}
                        </h4>
                        <Gc2Status tone={item.read ? "neutral" : "warning"}>
                          {item.read ? "Read" : "Unread"}
                        </Gc2Status>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                        {message}
                      </p>
                      {hasDistinctBody ? (
                        <p className="mt-2 text-xs leading-5 text-[var(--gc2-ink-muted)]">
                          {item.body}
                        </p>
                      ) : null}
                    </div>

                    <time className="gc2-data whitespace-nowrap pt-1 text-xs text-[var(--gc2-ink-muted)]">
                      {item.createdAt}
                    </time>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="grid min-h-56 place-items-center border-y border-[var(--gc2-line)] py-10 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-[var(--gc2-ink-muted)]">
                <Inbox aria-hidden="true" className="h-5 w-5" />
              </span>
              <p className="gc2-kicker mt-5">No stored notifications</p>
              <h3 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">
                The workspace notification ledger is empty.
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                GreenCloud will show only notification records received through the existing application state.
              </p>
            </div>
          </section>
        )}

        <p className="m-0 text-xs leading-5 text-[var(--gc2-ink-muted)]">
          Marking notifications as read updates the existing workspace record. This drawer does not clear activity history or change device, automation or safety state.
        </p>
      </div>
    </Gc2Dialog>
  );
}
