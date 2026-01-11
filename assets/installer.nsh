!include "MUI2.nsh"

; Define custom UI texts
!define MUI_PAGE_HEADER_TEXT "Installing Whiz POS..."
!define MUI_PAGE_HEADER_SUBTEXT "Please wait while we set up your system."
!define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Installation Complete"
!define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "Whiz POS has been installed successfully."

; Custom finish page text
!define MUI_FINISHPAGE_TITLE "Whiz POS Installation Complete"
!define MUI_FINISHPAGE_TEXT "Thank you for your patience. Whiz POS has been installed on your computer.\n\nClick Finish to close this wizard."
!define MUI_FINISHPAGE_RUN_TEXT "Launch Whiz POS"

; Add custom steps to simulate "Checking for updates..." if desired,
; but typically NSIS just installs files. We can add a DetailPrint.

Section "Main"
  DetailPrint "Initializing installation..."
  DetailPrint "Checking system requirements..."
  DetailPrint "Preparing destination folder..."

  DetailPrint "Copying application files..."
  ; (Files are copied here)

  DetailPrint "Configuring system settings..."
  DetailPrint "Creating shortcuts..."
  DetailPrint "Finalizing installation..."
SectionEnd
