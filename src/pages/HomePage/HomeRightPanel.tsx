import { Button } from '../../components/Button'
import { Tag } from '../../components/Tag'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/iconData'
import { AssigneeField, CoAssigneeField, CustomFieldsList, RightPanel, RightPanelSection, RightPanelTop, StatusField } from '../../patterns/RightPanel'
import type { CustomFieldValue } from '../../patterns/RightPanel'
import type { HomeStatus } from './homeData'

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
}

/** The right panel of the Home page: the inbox, Follow (shared email), Assignee, Status, Tags, then Contact, Account, Related and Custom fields. */
export function HomeRightPanel({ inboxName, coAssignee, customFields, contact, status, onStatusChange, following, onFollowChange }: HomeRightPanelProps) {
  return (
    <RightPanel aria-label="Details" tabs={[{ id: 'shared-inbox', label: 'Shared Inbox', icon: 'sminbox' }]} customizeWidgets>
      <RightPanelTop title={inboxName}>
        {following !== undefined && (
          <Row icon="view2" label="Follow">
            <Button size="xs" variant={following ? 'secondary-filled' : 'secondary'} iconLeft={<Icon name="view2" size={16} />} aria-pressed={following} onClick={() => onFollowChange?.(!following)}>
              {following ? 'Unfollow' : 'Follow'}
            </Button>
          </Row>
        )}
        <AssigneeField />
        {coAssignee && <CoAssigneeField />}
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
