using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkillForge.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIcons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IconObjectKey",
                table: "teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IconPreset",
                table: "teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IconObjectKey",
                table: "resources",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IconPreset",
                table: "resources",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IconObjectKey",
                table: "teams");

            migrationBuilder.DropColumn(
                name: "IconPreset",
                table: "teams");

            migrationBuilder.DropColumn(
                name: "IconObjectKey",
                table: "resources");

            migrationBuilder.DropColumn(
                name: "IconPreset",
                table: "resources");
        }
    }
}
