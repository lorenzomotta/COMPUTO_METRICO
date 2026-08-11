; Hook NSIS: pulizia residui della vecchia installazione "tauri-app"
; dopo il rename del prodotto in LP_COMPUTO.

!macro NSIS_HOOK_POSTINSTALL
  ; Rimuove i vecchi collegamenti sul Desktop
  Delete "$DESKTOP\tauri-app.lnk"

  ; Rimuove i vecchi collegamenti nel menu Start
  Delete "$SMPROGRAMS\tauri-app.lnk"
  Delete "$SMPROGRAMS\tauri-app\tauri-app.lnk"
  RMDir "$SMPROGRAMS\tauri-app"

  ; Se esiste ancora la vecchia cartella di installazione, prova a disinstallarla in silenzio
  IfFileExists "$LOCALAPPDATA\tauri-app\uninstall.exe" 0 lp_computo_skip_old_uninstall
    ExecWait '"$LOCALAPPDATA\tauri-app\uninstall.exe" /S'
  lp_computo_skip_old_uninstall:
!macroend
