-- AlterTable
ALTER TABLE "CommandReactionListener" ALTER COLUMN "cacheId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CommandResponseListener" ALTER COLUMN "cacheId" SET NOT NULL;

-- RenameIndex
ALTER INDEX "CommandReactionListener.messageId_userId_emojiId_action_cacheId" RENAME TO "CommandReactionListener_messageId_userId_emojiId_action_cac_key";

-- RenameIndex
ALTER INDEX "CommandResponseListener.channelId_userId_cacheId_unique" RENAME TO "CommandResponseListener_channelId_userId_cacheId_key";
