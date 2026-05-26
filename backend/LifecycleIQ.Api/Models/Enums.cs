namespace LifecycleIQ.Api.Models;

public enum UserRole { Admin, Manager }
public enum SlaTier { Basic, Standard, Premium, Critical }
public enum SlaComplianceStatus { Compliant, AtRisk, Breached }
public enum RiskTier { Low, Medium, High, Critical }
public enum NotificationType { Info, Low, Medium, High, Critical }
public enum ChangeRequestStatus { Pending, InProgress, Approved, Rejected, Completed }
public enum ChangeRequestPriority { Low, Medium, High, Critical }
