import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';


export interface DialogData {
  name: string;
}

@Component({
  selector: 'app-marker-edit-popup',
  templateUrl: './marker-edit-popup.html',
})
export class MarkerEditPopup {
  constructor(
    public dialogRef: MatDialogRef<MarkerEditPopup>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
