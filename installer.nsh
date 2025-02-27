!macro customInstall
  SetOutPath "$INSTDIR"
  nsExec::Exec '"$INSTDIR\node_modules\.bin\node" "$INSTDIR\postInstall.js"'
!macroend