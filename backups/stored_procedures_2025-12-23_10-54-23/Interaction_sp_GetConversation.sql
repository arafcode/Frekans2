
CREATE PROCEDURE [Interaction].[sp_GetConversation]
    @UserID1 INT,
    @UserID2 INT,
    @Limit INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        m.MessageID,
        m.SenderID,
        m.ReceiverID,
        m.MessageText,
        m.SentDate,
        m.IsRead,
        m.Metadata,
        sender.Username AS SenderUsername,
        sender.AvatarUrl AS SenderAvatar
    FROM [Interaction].[Messages] m
    INNER JOIN [Identity].[Users] sender ON m.SenderID = sender.UserID
    WHERE (m.SenderID = @UserID1 AND m.ReceiverID = @UserID2)
       OR (m.SenderID = @UserID2 AND m.ReceiverID = @UserID1)
    ORDER BY m.SentDate DESC;
END
