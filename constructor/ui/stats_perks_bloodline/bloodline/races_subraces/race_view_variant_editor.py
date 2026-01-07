import tkinter as tk

from ....theme import BUTTON_BG, MODE_ACTIVE_BG, MODE_ACTIVE_FG, TEXT_COLOR


class RaceViewVariantEditorMixin:
    def init_variant_editor_actions(self) -> None:
        self.variant_toggle_button.config(command=self.toggle_variant_editor)
        self.variant_exit_button.config(command=self.exit_variant_editor)
        self.update_variant_editor_buttons()

    def update_variant_editor_buttons(self) -> None:
        if self.variant_editor_active:
            self.variant_toggle_button.config(bg=MODE_ACTIVE_BG, fg=MODE_ACTIVE_FG)
            self.variant_exit_button.config(state="normal")
        else:
            self.variant_toggle_button.config(bg=BUTTON_BG, fg=TEXT_COLOR)
            self.variant_exit_button.config(state="disabled")

    def toggle_variant_editor(self) -> None:
        if self.variant_editor_active:
            return
        self.enter_variant_editor()

    def enter_variant_editor(self) -> None:
        if self.variant_editor_active:
            return
        self.variant_editor_active = True
        
        # Hide standard columns EXCEPT Variant frame
        self.paned.forget(self.race_frame)
        self.paned.forget(self.level_frame)
        self.paned.forget(self.detail_frame)
        
        # Ensure Variant frame is first (it will be, as it's the only remaining one)
        # Add Editor columns
        self.paned.add(self.variant_create_frame, minsize=300, stretch="always")
        self.paned.add(self.variant_edit_frame, minsize=400, stretch="always")
        
        # Placeholder content for now
        if not self.variant_create_frame.winfo_children():
            tk.LabelFrame(self.variant_create_frame, text="Create Variant (Placeholder)").pack(fill="both", expand=True, padx=5, pady=5)
        
        if not self.variant_edit_frame.winfo_children():
            tk.LabelFrame(self.variant_edit_frame, text="Edit Variant (Placeholder)").pack(fill="both", expand=True, padx=5, pady=5)

        self.update_variant_editor_buttons()

    def exit_variant_editor(self) -> None:
        if not self.variant_editor_active:
            return
        self.variant_editor_active = False
        
        # Hide editor columns
        self.paned.forget(self.variant_create_frame)
        self.paned.forget(self.variant_edit_frame)
        
        # Restore layout: [Races] [Levels] [Variants] [Detail]
        # self.variant_frame is currently visible.
        
        # Add Races and Levels BEFORE Variants
        self.paned.add(self.race_frame, before=self.variant_frame, minsize=220)
        self.paned.add(self.level_frame, before=self.variant_frame, minsize=170)
        
        # Add Detail AFTER Variants
        self.paned.add(self.detail_frame, minsize=260)
        
        self.update_variant_editor_buttons()
