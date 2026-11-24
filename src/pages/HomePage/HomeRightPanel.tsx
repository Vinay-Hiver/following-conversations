import { Button } from '../../components/Button'
import { Tag } from '../../components/Tag'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/iconData'
import type { AvatarColor } from '../../components/Avatar'
import { AssigneeField, CoAssigneeField, CustomFieldsList, RightPanel, RightPanelSection, RightPanelTop, StatusField } from '../../patterns/RightPanel'
import type { CustomFieldValue } from '../../patterns/RightPanel'
import type { HomeStatus } from './homeData'

/** A person in the Assignee and Co-assignee lists. */
export type HomePerson = { value: string; label: string; color: AvatarColor }

/** A row of the right panel: [icon] [label] ... [value], with the panel's own classes (RightPanel.css). */
function Row({ icon, label, children, link }: { icon: IconName; label: string; children?: React.ReactNode; link?: boolean }) {
  return (
    <div className="hot-rp-field">
      <div className="hot-rp-field__label"><Icon name={icon} size={14} /><span>{label}</span></div>
      <div className={`hot-rp-field__value${link ? ' hot-rp-field__value--link' : ''}`}>{children}</div>
    </div>
  )
}

export type HomeRightPanelProps = {
  /** The inbox of the open conversation, shown as the panel heading. */
  inboxName: string
  coAssignee: boolean
  customFields: CustomFieldValue[]
  contact?: { name: string; email?: string }
  status: HomeStatus
  onStatusChange: (status: HomeStatus) => void
  /** Shared email only: whether the signed-in user follows the open conversation. Leave out to hide Follow. */
  following?: boolean
  onFollowChange?: (following: boolean) => void
  /** Follow or Unfollow is being saved. */
  followBusy?: boolean
  /** The last Follow or Unfollow failed: the old state stays, with Retry. */
  followError?: string
  onFollowRetry?: () => void
  people: HomePerson[]
  assignee: string
  onAssigneeChange: (value: string) => void
  coAssigneeValue: string
  onCoAssigneeChange: (value: string) => void
}

/** The right panel of the Home page: the inbox, Follow (shared email), Assignee, Status, Tags, then Contact, Account, Related and Custom fields. */
export function HomeRightPanel({ inboxName, coAssignee, customFields, contact, status, onStatusChange, following, onFollowChange, followBusy, followError, onFollowRetry, people, assignee, onAssigneeChange, coAssigneeValue, onCoAssigneeChange }: HomeRightPanelProps) {
  return (
    <RightPanel aria-label="Details" tabs={[{ id: 'shared-inbox', label: 'Shared Inbox', icon: 'sminbox' }]} customizeWidgets>
      <RightPanelTop title={inboxName}>
        {following !== undefined && (
          <Row icon="view2" label="Follow">
            <Button size="xs" variant={following ? 'secondary-filled' : 'secondary'} disabled={followBusy} iconLeft={<Icon name="view2" size={16} />} aria-pressed={following} onClick={() => onFollowChange?.(!following)}>
              {followBusy ? (following ? 'Unfollowing…' : 'Following…') : following ? 'Unfollow' : 'Follow'}
            </Button>
          </Row>
        )}
        {following !== undefined && followError && (
          <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing2)', padding: '0 var(--spacing3) var(--spacing1)', color: 'var(--errorTextBody)' }}>
            <Icon name="erroricon" size={14} />
            <span className="text-body-sm-regular" style={{ flex: 1 }}>{followError}</span>
            <Button size="xs" variant="ghost" onClick={onFollowRetry}>Retry</Button>
          </div>
        )}
        <AssigneeField people={people} value={assignee} onChange={onAssigneeChange} />
        {coAssignee && <CoAssigneeField people={people} value={coAssigneeValue} onChange={onCoAssigneeChange} />}
        <StatusField value={status} onChange={onStatusChange} />
        <Row icon="tag" label="Tags">
          <Tag color="violet" onRemove={() => {}} removeLabel="Remove Finance">Finance</Tag>
        </Row>
      </RightPanelTop>

      <RightPanelSection id="contact" title="Contact" icon="contact" defaultExpanded>
        <Row icon="user" label="Name">{contact?.name ?? ''}</Row>
        <Row icon="mailbox" label="Email">{contact?.email ?? ''}</Row>
        <Row icon="building" label="Account">Google</Row>
        <Row icon="previousconversations" label="Conversations" link>60</Row>
      </RightPanelSection>

      <RightPanelSection id="account" title="Account" icon="building">
        <Row icon="building" label="Name">Lumon Industries</Row>
        <Row icon="user" label="Owner">Mark Scout</Row>
        <Row icon="previousconversations" label="Conversations" link>112</Row>
      </RightPanelSection>

      <RightPanelSection id="related" title="Related conversations" icon="previousconversations">
        <Row icon="mailbox" label="Last email">Yesterday</Row>
        <Row icon="flag" label="Open">3</Row>
      </RightPanelSection>

      <RightPanelSection id="custom" title="Custom fields" icon="text" defaultExpanded>
        <CustomFieldsList fields={customFields} />
      </RightPanelSection>
    </RightPanel>
  )
}
