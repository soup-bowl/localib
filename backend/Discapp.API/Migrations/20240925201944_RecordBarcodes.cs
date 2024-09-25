using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Discapp.API.Migrations
{
    /// <inheritdoc />
    public partial class RecordBarcodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "Recorded",
                table: "Records",
                type: "datetime(6)",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)",
                oldDefaultValue: new DateTime(2024, 8, 7, 22, 21, 54, 557, DateTimeKind.Local).AddTicks(4690));

            migrationBuilder.AddColumn<string>(
                name: "Barcode",
                table: "Records",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Barcode",
                table: "Records");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Recorded",
                table: "Records",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(2024, 8, 7, 22, 21, 54, 557, DateTimeKind.Local).AddTicks(4690),
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)");
        }
    }
}
