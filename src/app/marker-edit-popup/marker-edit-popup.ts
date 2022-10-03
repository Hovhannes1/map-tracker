import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';


export interface DialogData {
  name: string;
  lon: number;
  lat: number;
}

@Component({
  selector: 'app-marker-edit-popup',
  templateUrl: './marker-edit-popup.html',
})
export class MarkerEditPopup {
  public isEdit = false;
  constructor(
    public dialogRef: MatDialogRef<MarkerEditPopup>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  ngOnInit(): void {
    if (this.data.name !== 'New User Name') {
      this.isEdit = true;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
