'use client';

import {
  Slack,
  MessageSquare,
  Trash2,
  Plus,
  Settings,
  Check,
  X,
  Bell,
  ExternalLink,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { useState } from 'react';

import { useIntegrations } from '../hooks/useIntegrations';
import { IntegrationEvent, EVENT_MAPPINGS } from '../types';

const AVAILABLE_EVENTS: { value: IntegrationEvent; label: string }[] = [
  { value: 'card_created', label: '📋 Card Created' },
  { value: 'card_moved', label: '🔄 Card Moved' },
  { value: 'card_edited', label: '✏️ Card Edited' },
  { value: 'card_deleted', label: '🗑️ Card Deleted' },
  { value: 'comment_added', label: '💬 Comment Added' },
  { value: 'due_date_set', label: '📅 Due Date Set' },
  { value: 'member_assigned', label: '👤 Member Assigned' },
];

interface Integration {
  id: string;
  type: 'slack' | 'discord';
  name: string;
  webhookUrl: string;
  enabled: boolean;
  events: string[];
}

interface IntegrationsListProps {
  boardId?: string;
}

export function IntegrationsList({ boardId }: IntegrationsListProps) {
  const {
    integrations,
    isLoading,
    createIntegration,
    deleteIntegration,
    testIntegration,
    toggleIntegration,
  } = useIntegrations();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    type: 'slack' as 'slack' | 'discord',
    name: '',
    webhookUrl: '',
    events: [] as IntegrationEvent[],
  });

  const handleAddIntegration = async () => {
    if (!newIntegration.name || !newIntegration.webhookUrl || newIntegration.events.length === 0) {
      return;
    }

    await createIntegration({
      type: newIntegration.type,
      name: newIntegration.name,
      webhookUrl: newIntegration.webhookUrl,
      events: newIntegration.events,
    });

    setShowAddDialog(false);
    setNewIntegration({
      type: 'slack',
      name: '',
      webhookUrl: '',
      events: [],
    });
  };

  const toggleEvent = (event: IntegrationEvent) => {
    setNewIntegration(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrations</h2>
          <p className="text-muted-foreground">
            Connect Slack or Discord to get notifications when cards change
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Integrations List */}
      {integrations.length === 0 && !isLoading ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <CardContent className="text-center">
            <h3 className="text-lg font-medium mb-2">No integrations yet</h3>
            <p className="text-muted-foreground mb-4">
              Connect Slack or Discord to start receiving notifications
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add First Integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {integrations.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onToggle={() => toggleIntegration(integration.id)}
              onTest={() => testIntegration(integration.id)}
              onDelete={() => deleteIntegration(integration.id)}
            />
          ))}
        </div>
      )}

      {/* Add Integration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>Connect Slack or Discord to receive notifications</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="flex gap-2">
                <Button
                  variant={newIntegration.type === 'slack' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setNewIntegration(prev => ({ ...prev, type: 'slack' }))}
                >
                  <Slack className="h-4 w-4 mr-2" />
                  Slack
                </Button>
                <Button
                  variant={newIntegration.type === 'discord' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setNewIntegration(prev => ({ ...prev, type: 'discord' }))}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Discord
                </Button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Integration Name</Label>
              <Input
                id="name"
                placeholder="e.g., Team Notifications"
                value={newIntegration.name}
                onChange={e => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input
                id="webhook"
                placeholder={
                  newIntegration.type === 'slack'
                    ? 'https://hooks.slack.com/services/...'
                    : 'https://discord.com/api/webhooks/...'
                }
                value={newIntegration.webhookUrl}
                onChange={e => setNewIntegration(prev => ({ ...prev, webhookUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                {newIntegration.type === 'slack' ? (
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Learn how to create a Slack webhook
                    <ExternalLink className="h-3 w-3 inline ml-1" />
                  </a>
                ) : (
                  <a
                    href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Learn how to create a Discord webhook
                    <ExternalLink className="h-3 w-3 inline ml-1" />
                  </a>
                )}
              </p>
            </div>

            <Separator />

            {/* Events */}
            <div className="space-y-2">
              <Label>Notify on</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map(event => (
                  <label
                    key={event.value}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      newIntegration.events.includes(event.value)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={newIntegration.events.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddIntegration}
              disabled={
                !newIntegration.name ||
                !newIntegration.webhookUrl ||
                newIntegration.events.length === 0
              }
            >
              Add Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Integration Card Component
interface IntegrationCardProps {
  integration: Integration;
  onToggle: () => void;
  onTest: () => void;
  onDelete: () => void;
}

function IntegrationCard({ integration, onToggle, onTest, onDelete }: IntegrationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                integration.type === 'slack' ? 'bg-[#4A154B]' : 'bg-[#5865F2]'
              }`}
            >
              {integration.type === 'slack' ? (
                <Slack className="h-5 w-5 text-white" />
              ) : (
                <MessageSquare className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <CardDescription>
                {integration.type === 'slack' ? 'Slack' : 'Discord'} notifications
              </CardDescription>
            </div>
          </div>
          <Switch checked={integration.enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Events */}
          <div className="flex flex-wrap gap-1">
            {integration.events.map(event => {
              const mapping = EVENT_MAPPINGS[event as IntegrationEvent];
              return (
                <Badge key={event} variant="secondary" className="text-xs">
                  {mapping?.slackEmoji || '📌'} {event.replace(/_/g, ' ')}
                </Badge>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onTest}>
              <Bell className="h-4 w-4 mr-1" />
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
