
-- Create new procedure with Metadata parameter
CREATE PROCEDURE [Interaction].[sp_SendMessage]
    @SenderID INT,
    @ReceiverID INT,
    @MessageText NVARCHAR(1000),
    @Metadata NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validation
    IF @SenderID = @ReceiverID
    BEGIN
        RAISERROR('Cannot message yourself', 16, 1);
        RETURN;
    END
    
    -- Check if they are friends (both follow each other)
    IF NOT EXISTS (
        SELECT 1 FROM [Interaction].[Follows] f1
        WHERE f1.FollowerID = @SenderID AND f1.FollowingID = @ReceiverID
          AND EXISTS (
              SELECT 1 FROM [Interaction].[Follows] f2
              WHERE f2.FollowerID = @ReceiverID AND f2.FollowingID = @SenderID
          )
    )
    BEGIN
        RAISERROR('Can only message friends (mutual followers)', 16, 1);
        RETURN;
    END
    
    -- Insert message
    INSERT INTO [Interaction].[Messages] (SenderID, ReceiverID, MessageText, SentDate, IsRead, Metadata)
    VALUES (@SenderID, @ReceiverID, @MessageText, GETDATE(), 0, @Metadata);
    
    SELECT 
        SCOPE_IDENTITY() AS MessageID,
        @SenderID AS SenderID,
        @ReceiverID AS ReceiverID,
        @MessageText AS MessageText,
        GETDATE() AS SentDate,
        0 AS IsRead,
        @Metadata AS Metadata;
END
