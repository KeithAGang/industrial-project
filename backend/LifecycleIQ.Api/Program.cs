using System.Text;
using System.Text.Json.Serialization;
using LifecycleIQ.Api.Data;
using LifecycleIQ.Api.Middleware;
using LifecycleIQ.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHttpClient();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<AiBriefingService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<WfaService>();

builder.Services.AddControllers().AddJsonOptions(opt =>
{
    opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    opt.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(key),
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(opt => opt.AddPolicy("Frontend", p =>
    p.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://frontend")
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()));

// OpenAPI available in all environments (no development-only guard)
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseStaticFiles();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapOpenApi();  // available at /openapi/v1.json in all environments
app.MapScalarApiReference(opt => opt.WithTitle("LifecycleIQ API").WithTheme(ScalarTheme.Moon));

// Auto-migrate and seed on startup
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Drop stale EF migration history (left by any previous Migrate() attempt)
    // so EnsureCreated sees an empty schema and creates all tables correctly.
    await ctx.Database.ExecuteSqlRawAsync(
        @"DROP TABLE IF EXISTS ""__EFMigrationsHistory""");
    ctx.Database.EnsureCreated();
    await LifecycleIQ.Api.Data.DbSeeder.SeedAsync(ctx);
}

app.Run();
