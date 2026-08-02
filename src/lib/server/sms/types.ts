export type SmsMessage = {
  /** Recipient in E.164 form, e.g. "+2290142077548". */
  to: string;
  body: string;
};

/**
 * A replaceable SMS transport.
 *
 * ZENO ships to Benin, Côte d'Ivoire and Togo, where deliverability and price
 * differ sharply between aggregators. Keeping the transport behind this
 * interface means switching provider — or routing per country — is a
 * configuration change, never a rewrite of the verification flow.
 */
export type SmsProvider = {
  readonly name: string;
  send(message: SmsMessage): Promise<void>;
};
