import {MessageAttachment} from 'discord.js';

/**
 * Estimated max size of a message create request without attachments in bytes.
 * 9000 special UTF-8 chars.
 */
const MAX_MESSAGE_REQUEST_OVERHEAD_SIZE = 9000 * 2;

const MEBI_BYTE = 2 ** 20;

/**
 * Guild premium tiers mapped to the max upload sizes.
 */
const MAX_UPLOAD_SIZES = [8 * MEBI_BYTE, 8 * MEBI_BYTE, 50 * MEBI_BYTE, 100 * MEBI_BYTE] as const;

/**
 * Result of attachment partitioning.
 */
export interface AttachmentPartition {
  sendable: MessageAttachment[];
  unsendable: MessageAttachment[];
  /**
   * Cumulative size of all sendable attachments.
   */
  sendableSize: number;
}

/**
 * Partitions the given attachments into sendable and unsendable depending on the upload size limit.
 *
 * @param additionalOverhead Additional size overhead in bytes of the message (for example extra required attachments) to take into account.
 */
export function partitionAttachments(
  attachments: MessageAttachment[],
  guildPremiumTier: number,
  additionalOverhead = 0
): AttachmentPartition {
  if (attachments.length === 0) return {sendable: [], unsendable: [], sendableSize: 0};
  const sorted = attachments.sort(
    (attachment1, attachment2) => attachment1.size - attachment2.size
  );
  const sizeLimit = MAX_UPLOAD_SIZES[guildPremiumTier];

  let cumulativeSize = additionalOverhead + MAX_MESSAGE_REQUEST_OVERHEAD_SIZE;
  const firstUnsendableIndex = sorted.findIndex(attachment => {
    cumulativeSize += attachment.size;
    return cumulativeSize > sizeLimit;
  });
  if (firstUnsendableIndex !== -1) cumulativeSize -= attachments[firstUnsendableIndex].size;

  return {
    sendable: firstUnsendableIndex < 0 ? attachments : attachments.slice(0, firstUnsendableIndex),
    unsendable: firstUnsendableIndex < 0 ? [] : attachments.slice(firstUnsendableIndex),
    sendableSize: cumulativeSize,
  };
}
