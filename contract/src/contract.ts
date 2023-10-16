import { NearBindgen, near, call, view } from "near-sdk-js";

@NearBindgen({})
class DeceasedProfile {
  fullName: string;
  birthDate: string;
  deathDate: string;
  ipfsLink: string;

  constructor(
    fullName: string,
    birthDate: string,
    deathDate: string,
    ipfsLink: string
  ) {
    this.fullName = fullName;
    this.birthDate = birthDate;
    this.deathDate = deathDate;
    this.ipfsLink = ipfsLink;
  }
}

@NearBindgen({})
class MemorialMessage {
  accountId: string;
  message: string;
  timestamp: string;

  constructor(accountId: string, message: string, timestamp: string) {
    this.accountId = accountId;
    this.message = message;
    this.timestamp = timestamp;
  }
}

@NearBindgen({})
class DeathRegistry {
  registry: { [key: string]: DeceasedProfile } = {};
  messages: { [key: string]: MemorialMessage[] } = {};
  profileIds: string[] = [];

  constructor() {
    this.registry = {};
    this.messages = {};
    this.profileIds = [];
}

  @call({})
  registerDeceased({
    id,
    fullName,
    birthDate,
    deathDate,
    ipfsLink,
  }: {
    id: string;
    fullName: string;
    birthDate: string;
    deathDate: string;
    ipfsLink: string;
  }): void {
    near.log("Entering registerDeceased function.");

    near.log(
      `Creating profile with: ${fullName}, ${birthDate}, ${deathDate}, ${ipfsLink}`
    );
    const profile = new DeceasedProfile(
      fullName,
      birthDate,
      deathDate,
      ipfsLink
    );
    near.log("Profile created.");

    near.log(`Setting profile in registry with ID: ${id}`);
    near.log(`Checking if registry is defined: ${this.registry !== undefined}`);
    near.log(`Checking if id is defined: ${id !== undefined}`);
    near.log(`Checking if profile is defined: ${profile !== undefined}`);

    if (!this.registry) {
      this.registry = {};
    }
    this.registry[id] = profile;
    near.log("Profile set in registry.");

    near.log(`Adding ID to profileIds: ${id}`);
    if (!this.profileIds) {
        this.profileIds = [];
      }
    this.profileIds.push(id);

    near.log("ID added to profileIds.");

    near.log(
      `Profile registered for ${profile.fullName} with IPFS link ${ipfsLink}`
    );
  }

  @view({})
  getProfile({ id }: { id: string }): DeceasedProfile | null {
    return this.registry[id] || null;
  }

  @call({})
  addMemorialMessage({
    id,
    messageText,
  }: {
    id: string;
    messageText: string;
  }): void {
    const accountId = near.predecessorAccountId();
    const timestamp = near.blockTimestamp().toString();
    const message = new MemorialMessage(accountId, messageText, timestamp);

    if (!this.messages) {
        this.messages = {};
      }
      
    if (!this.messages[id]) {
      this.messages[id] = [];
    }

    near.log(`ID passed to addMemorialMessage: ${id}`);
    this.messages[id].push(message);

    near.log(`Message added for ${id} by ${accountId}`);
  }

  @view({})
  getMemorialMessages({ id }: { id: string }): MemorialMessage[] {
    return this.messages[id] || [];
  }

  @view({})
  getAllProfileIds(): string[] {
    return this.profileIds;
  }
}
