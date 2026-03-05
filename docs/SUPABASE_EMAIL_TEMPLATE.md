# Template email OTP — Autocomplete iOS / Android

## Pourquoi ?

iOS et Android detectent automatiquement les codes OTP dans les emails
et SMS grace a des patterns specifiques. Le texte **"Your code is:"**
(en anglais) est le format exact reconnu par le systeme d'autocomplete
natif (`autoComplete="one-time-code"`).

## Configuration

1. Aller dans le dashboard Supabase
2. **Authentication** > **Email Templates**
3. Selectionner le template **"Magic Link"** ou **"OTP"**
4. Remplacer le contenu du body par le template ci-dessous

## Template a copier-coller

```html
<h2>Votre code de connexion Fidelizy</h2>

<p>Your code is: {{ .Token }}</p>

<p>Ce code expire dans 10 minutes.</p>

<p>Si vous n'avez pas demande ce code, ignorez cet email.</p>
```

## Points importants

- **"Your code is:"** doit rester en anglais — c'est le pattern iOS/Android
- `{{ .Token }}` est la variable Supabase qui contient le code OTP a 6 chiffres
- Le code cote client (`autoComplete="one-time-code"` + `pattern="[0-9]*"`)
  est deja en place dans `app/components/OTPInput.tsx`
- Tester sur un iPhone physique pour verifier le préremplissage
