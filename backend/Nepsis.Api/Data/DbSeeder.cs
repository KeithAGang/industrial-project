using Nepsis.Api.Models;

namespace Nepsis.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (db.Users.Any()) return;

        var admin = new User
        {
            Id           = Guid.Parse("a1000000-0000-0000-0000-000000000001"),
            Email        = "admin@nepsis.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            FullName     = "System Administrator",
            Role         = UserRole.Admin,
        };

        var manager = new User
        {
            Id           = Guid.Parse("a2000000-0000-0000-0000-000000000002"),
            Email        = "manager@nepsis.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("manager123"),
            FullName     = "Jane Manager",
            Role         = UserRole.Manager,
        };

        db.Users.AddRange(admin, manager);

        var acme = new Client
        {
            Id            = Guid.Parse("c1000000-0000-0000-0000-000000000001"),
            Name          = "Acme Financial Services",
            ContactPerson = "Robert Chen",
            Email         = "r.chen@acme-finance.com",
            Phone         = "+263 77 123 4567",
        };

        var zimtech = new Client
        {
            Id            = Guid.Parse("c2000000-0000-0000-0000-000000000002"),
            Name          = "ZimTech Industries",
            ContactPerson = "Tendai Moyo",
            Email         = "tendai.moyo@zimtech.co.zw",
            Phone         = "+263 77 987 6543",
        };

        var council = new Client
        {
            Id            = Guid.Parse("c3000000-0000-0000-0000-000000000003"),
            Name          = "Harare Municipal Council",
            ContactPerson = "Chiedza Nyamhondera",
            Email         = "c.nyamhondera@hararecity.gov.zw",
        };

        db.Clients.AddRange(acme, zimtech, council);

        db.Solutions.AddRange(
            new Solution
            {
                Id                  = Guid.Parse("e1000000-0000-0000-0000-000000000001"),
                ClientId            = acme.Id,
                Name                = "CoreBanking ERP",
                Description         = "Enterprise resource planning system managing financial operations.",
                CurrentVersion      = "4.2.1",
                LatestVersion       = "5.0.0",
                LicenceExpiryDate   = DateTime.UtcNow.AddDays(25),
                SlaTier             = SlaTier.Critical,
                SlaComplianceStatus = SlaComplianceStatus.AtRisk,
                LastMaintenanceDate = DateTime.UtcNow.AddDays(-95),
            },
            new Solution
            {
                Id                  = Guid.Parse("e2000000-0000-0000-0000-000000000002"),
                ClientId            = acme.Id,
                Name                = "Reporting Suite",
                Description         = "Financial reporting and analytics platform.",
                CurrentVersion      = "2.8.0",
                LatestVersion       = "3.1.0",
                LicenceExpiryDate   = DateTime.UtcNow.AddDays(180),
                SlaTier             = SlaTier.Standard,
                SlaComplianceStatus = SlaComplianceStatus.Compliant,
                LastMaintenanceDate = DateTime.UtcNow.AddDays(-20),
            },
            new Solution
            {
                Id                  = Guid.Parse("e3000000-0000-0000-0000-000000000003"),
                ClientId            = zimtech.Id,
                Name                = "MES Platform",
                Description         = "Manufacturing execution system for factory floor management.",
                CurrentVersion      = "1.4.3",
                LatestVersion       = "2.0.0",
                LicenceExpiryDate   = DateTime.UtcNow.AddDays(5),
                SlaTier             = SlaTier.Premium,
                SlaComplianceStatus = SlaComplianceStatus.Breached,
                LastMaintenanceDate = DateTime.UtcNow.AddDays(-200),
            },
            new Solution
            {
                Id                  = Guid.Parse("e4000000-0000-0000-0000-000000000004"),
                ClientId            = council.Id,
                Name                = "Citizen Portal",
                Description         = "Online portal for municipal services and rate payments.",
                CurrentVersion      = "3.0.2",
                LatestVersion       = "3.0.2",
                LicenceExpiryDate   = DateTime.UtcNow.AddDays(400),
                SlaTier             = SlaTier.Standard,
                SlaComplianceStatus = SlaComplianceStatus.Compliant,
                LastMaintenanceDate = DateTime.UtcNow.AddDays(-10),
            }
        );

        await db.SaveChangesAsync();
    }
}
