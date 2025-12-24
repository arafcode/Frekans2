
CREATE PROCEDURE [Identity].[sp_UpdateUserActivity]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [Identity].[Users]
    SET LastActiveAt = GETDATE()
    WHERE UserID = @UserID;
    
    SELECT 
        UserID,
        LastActiveAt
    FROM [Identity].[Users]
    WHERE UserID = @UserID;
END
