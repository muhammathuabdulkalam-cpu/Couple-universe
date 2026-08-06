export const RELATIONSHIP_TYPES = {
  COUPLE: 'Couple',
  FRIENDSHIP: 'Friendship',
  FAMILY: 'Family',
  SIBLING: 'Sibling',
  TEAM: 'Team',
  CUSTOM: 'Custom',
} as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[keyof typeof RELATIONSHIP_TYPES];
