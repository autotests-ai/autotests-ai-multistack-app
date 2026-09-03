using Dev.Multistack.App;
using Dev.Multistack.App.Config;
using Dev.Multistack.App.Security;
using Dev.Multistack.App.Store;

var cfg = AppConfig.Load();
await using var postgres = PostgresStore.Open(cfg.DatabaseUrl);
await postgres.WaitReadyAsync(TimeSpan.FromSeconds(60), CancellationToken.None);
await postgres.ApplySchemaAsync(SchemaSql.ReadFromOutput(), CancellationToken.None);
await Seed.ApplyAsync(postgres, PasswordHasher.Hash, CancellationToken.None);

var app = WebApp.Create(
    postgres,
    new TokenService(cfg.JwtSecret, cfg.JwtExpiration),
    cfg.ServiceName,
    $"http://0.0.0.0:{cfg.ServerPort}");
await app.RunAsync();
