; Hook NSIS: pulizia residui "tauri-app" + ricrea collegamenti con icona corretta.

!macro NSIS_HOOK_POSTINSTALL
  ; Rimuove i vecchi collegamenti sul Desktop / Start
  Delete "$DESKTOP\tauri-app.lnk"
  Delete "$SMPROGRAMS\tauri-app.lnk"
  Delete "$SMPROGRAMS\tauri-app\tauri-app.lnk"
  RMDir "$SMPROGRAMS\tauri-app"

  ; Se esiste ancora la vecchia cartella di installazione, prova a disinstallarla in silenzio
  IfFileExists "$LOCALAPPDATA\tauri-app\uninstall.exe" 0 lp_computo_skip_old_uninstall
    ExecWait '"$LOCALAPPDATA\tauri-app\uninstall.exe" /S'
  lp_computo_skip_old_uninstall:

  ; Ricrea sempre i collegamenti puntando all'exe attuale (icona inclusa)
  IfFileExists "$INSTDIR\${MAINBINARYNAME}.exe" 0 lp_computo_skip_shortcuts
    Delete "$DESKTOP\${PRODUCTNAME}.lnk"
    Delete "$SMPROGRAMS\${PRODUCTNAME}.lnk"
    CreateShortCut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
    CreateShortCut "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
  lp_computo_skip_shortcuts:
!macroend
