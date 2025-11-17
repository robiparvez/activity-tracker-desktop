#!/usr/bin/env python3
"""
Enhanced Analysis for configurable days and employee: Comprehensive work hours analysis
with productivity insights, recommendations, and detailed metrics.
"""

import json
import base64
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union, TypedDict
from dataclasses import dataclass
from enum import Enum
import logging

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from cryptography.fernet import Fernet
from config import DECRYPTION_KEY, EMPLOYEE_ID

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class AnalysisChoice(TypedDict):
    """Type definition for analysis choice."""

    type: str
    date: Optional[str]
    dates: Optional[List[str]]


class ProductivityLevel(Enum):
    """Productivity level indicators."""

    EXCELLENT = "🟢"
    GOOD = "🟡"
    POOR = "🔴"


@dataclass
class ActivityRecord:
    """Represents a single activity record."""

    start_time: str
    duration: float
    is_afk: bool


@dataclass
class DailyMetrics:
    """Daily productivity metrics."""

    total_hours: float
    active_hours: float
    inactive_hours: float
    afk_hours: float
    activity_rate: float
    inactivity_rate: float
    afk_rate: float
    total_records: int


@dataclass
class ProductivityMetrics:
    """Productivity analysis metrics."""

    inactive_hours: float
    inactivity_rate: float
    afk_rate: float
    activity_rate: float
    assessments: List[str]


class ActivityAnalyzer:
    """Main class for analyzing activity data."""

    def __init__(self, data_file: Union[str, Path] = "activity.json") -> None:
        """Initialize the analyzer with data file path."""
        self.data_file = Path(data_file)
        self.decryption_key = self._prepare_key()
        self.fernet = Fernet(self.decryption_key)

    def _prepare_key(self) -> bytes:
        """Prepare the decryption key."""
        if isinstance(DECRYPTION_KEY, str):
            return DECRYPTION_KEY.encode()
        return DECRYPTION_KEY

    def _load_activity_data(self) -> List[Dict]:
        """Load activity data from JSON file."""
        try:
            if not self.data_file.exists():
                raise FileNotFoundError(
                    f"Activity data file not found: {self.data_file}"
                )

            with self.data_file.open("r", encoding="utf-8") as file:
                return json.load(file)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in {self.data_file}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error loading data from {self.data_file}: {e}")
            raise

    def _decrypt_field(self, encrypted_data: str) -> str:
        """Decrypt a single encrypted field."""
        try:
            decoded_data = base64.b64decode(encrypted_data)
            decrypted_data = self.fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.warning(f"Failed to decrypt field: {e}")
            return ""

    def _parse_activity_record(self, record: Dict) -> Optional[ActivityRecord]:
        """Parse a single activity record."""
        try:
            duration_str = self._decrypt_field(record["duration_seconds"])
            afk_str = self._decrypt_field(record["is_afk"])

            if not duration_str or not afk_str:
                return None

            duration = float(duration_str)
            is_afk = afk_str.lower() == "true"

            return ActivityRecord(
                start_time=record["start_time"], duration=duration, is_afk=is_afk
            )
        except (KeyError, ValueError, TypeError) as e:
            logger.warning(f"Failed to parse record: {e}")
            return None

    def _filter_records_by_date_and_employee(
        self, data: List[Dict], target_date: str
    ) -> List[ActivityRecord]:
        """Filter records by date and hostname."""
        records = []

        for record in data:
            if record.get("employee_id") == EMPLOYEE_ID and record.get(
                "start_time", ""
            ).startswith(target_date):

                parsed_record = self._parse_activity_record(record)
                if parsed_record:
                    records.append(parsed_record)

        return records

    def _calculate_daily_metrics(self, records: List[ActivityRecord]) -> DailyMetrics:
        """Calculate daily metrics from activity records."""
        if not records:
            return DailyMetrics(0, 0, 0, 0, 0, 0, 0, 0)

        total_seconds = sum(record.duration for record in records)
        afk_seconds = sum(record.duration for record in records if record.is_afk)
        active_seconds = total_seconds - afk_seconds

        # Convert to hours
        total_hours = total_seconds / 3600
        afk_hours = afk_seconds / 3600
        active_hours = active_seconds / 3600
        inactive_hours = total_hours - active_hours

        # Calculate rates
        activity_rate = (
            (active_seconds / total_seconds * 100) if total_seconds > 0 else 0
        )
        inactivity_rate = (inactive_hours / total_hours * 100) if total_hours > 0 else 0
        afk_rate = (afk_hours / total_hours * 100) if total_hours > 0 else 0

        return DailyMetrics(
            total_hours=total_hours,
            active_hours=active_hours,
            inactive_hours=inactive_hours,
            afk_hours=afk_hours,
            activity_rate=activity_rate,
            inactivity_rate=inactivity_rate,
            afk_rate=afk_rate,
            total_records=len(records),
        )

    def _analyze_productivity_metrics(
        self, metrics: DailyMetrics
    ) -> ProductivityMetrics:
        """Analyze productivity metrics and provide insights."""
        assessments = []

        # Total Hours Analysis (first)
        if metrics.total_hours >= 8:
            assessments.append(
                f"{ProductivityLevel.EXCELLENT.value} Full work day tracked "
                f"({metrics.total_hours:.1f}h) - committed work schedule"
            )
        elif metrics.total_hours >= 6:
            assessments.append(
                f"{ProductivityLevel.GOOD.value} Substantial work time "
                f"({metrics.total_hours:.1f}h) - good productivity window"
            )
        else:
            assessments.append(
                f"{ProductivityLevel.POOR.value} Limited work time "
                f"({metrics.total_hours:.1f}h) - short work sessions"
            )

        # Activity Rate Analysis (second)
        if metrics.activity_rate >= 80:
            assessments.append(
                f"{ProductivityLevel.EXCELLENT.value} Excellent activity rate "
                f"({metrics.activity_rate:.1f}%) - highly focused work"
            )
        elif metrics.activity_rate >= 60:
            assessments.append(
                f"{ProductivityLevel.GOOD.value} Good activity rate "
                f"({metrics.activity_rate:.1f}%) - productive work sessions"
            )
        else:
            assessments.append(
                f"{ProductivityLevel.POOR.value} Low activity rate "
                f"({metrics.activity_rate:.1f}%) - high distraction levels"
            )

        # Inactivity Analysis (third)
        if metrics.inactivity_rate <= 20:
            assessments.append(
                f"{ProductivityLevel.EXCELLENT.value} Low inactivity "
                f"({metrics.inactivity_rate:.1f}%) - efficient time usage"
            )
        elif metrics.inactivity_rate <= 40:
            assessments.append(
                f"{ProductivityLevel.GOOD.value} Moderate inactivity "
                f"({metrics.inactivity_rate:.1f}%) - room for improvement"
            )
        else:
            assessments.append(
                f"{ProductivityLevel.POOR.value} High inactivity "
                f"({metrics.inactivity_rate:.1f}%) - significant time loss"
            )

        return ProductivityMetrics(
            inactive_hours=metrics.inactive_hours,
            inactivity_rate=metrics.inactivity_rate,
            afk_rate=metrics.afk_rate,
            activity_rate=metrics.activity_rate,
            assessments=assessments,
        )

    def _format_time_range(self, records: List[ActivityRecord]) -> Tuple[str, str]:
        """Format start and end times in AM/PM format."""
        if not records:
            return "N/A", "N/A"

        start_time = min(record.start_time for record in records)
        end_time = max(record.start_time for record in records)

        try:
            start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

            start_formatted = start_dt.strftime("%I:%M %p")
            end_formatted = end_dt.strftime("%I:%M %p")

            return start_formatted, end_formatted
        except ValueError as e:
            logger.warning(f"Failed to parse time format: {e}")
            return "Invalid", "Invalid"

    def _print_productivity_analysis(
        self, productivity_metrics: ProductivityMetrics
    ) -> None:
        """Print productivity analysis results."""
        print(f"\n{'=' * 70}")
        print("📈 PRODUCTIVITY ANALYSIS")
        print(f"{'=' * 70}")

        print("\n📊 DETAILED METRICS:")
        print(f"   Activity Rate: {productivity_metrics.activity_rate:.1f}%")
        print(f"   Inactivity Rate: {productivity_metrics.inactivity_rate:.1f}%")

        if productivity_metrics.assessments:
            print("\n📊 ANALYSIS:")
            for assessment in productivity_metrics.assessments:
                print(f"   {assessment}")

    def get_available_dates(self) -> List[str]:
        """Get list of available dates from the activity data."""
        try:
            data = self._load_activity_data()
            dates = set()

            for record in data:
                if record.get("employee_id") == EMPLOYEE_ID:
                    start_time = record.get("start_time", "")
                    if len(start_time) >= 10:
                        date = start_time[:10]
                        dates.add(date)

            return sorted(list(dates))
        except Exception as e:
            logger.error(f"Failed to get available dates: {e}")
            return []

    def analyze_specific_date(self, target_date: str) -> None:
        """Analyze working hours for specified employee on a specific date."""
        logger.info(f"Analyzing data for {EMPLOYEE_ID} on {target_date}")

        try:
            data = self._load_activity_data()
            records = self._filter_records_by_date_and_employee(data, target_date)

            if not records:
                print(f"❌ No data found for {EMPLOYEE_ID} on {target_date}")
                return

            metrics = self._calculate_daily_metrics(records)
            start_time, end_time = self._format_time_range(records)

            # Display results
            print(f"\nENHANCED WORK HOURS ANALYSIS FOR {EMPLOYEE_ID} ON {target_date}")
            print("=" * 70)
            print("\n📊 Summary:")
            print(f"   Total Records: {metrics.total_records}")
            print(f"   Total Time: {metrics.total_hours:.2f}h")
            print(f"   Active Time: {metrics.active_hours:.2f}h")
            print(f"   Inactive Time: {metrics.inactive_hours:.2f}h")
            print(f"   Activity Rate: {metrics.activity_rate:.1f}%")
            print(f"   Inactivity Rate: {metrics.inactivity_rate:.1f}%")

            print("\n⏰ Time Range:")
            print(f"   Started: {start_time}")
            print(f"   Ended: {end_time}")

            # Productivity Analysis
            productivity_metrics = self._analyze_productivity_metrics(metrics)
            self._print_productivity_analysis(productivity_metrics)

            print(
                f"\n✅ FINAL ANSWER: {EMPLOYEE_ID} worked {metrics.active_hours:.2f} hours on {target_date}"
            )
            print(
                f"   (Total: {metrics.total_hours:.2f}h including {metrics.inactive_hours:.2f}h inactive time)"
            )

        except Exception as e:
            logger.error(f"Error analyzing specific date {target_date}: {e}")
            print(f"❌ Error analyzing data for {target_date}: {e}")

    def create_histogram_charts(self, available_dates: List[str]) -> None:
        """Create histogram charts for activity metrics analysis."""
        if not available_dates:
            print("❌ No data available for histogram creation")
            return

        logger.info(f"Creating histogram charts for {len(available_dates)} dates")

        try:
            data = self._load_activity_data()

            # Collect metrics for all dates
            metrics_data = []

            for date in available_dates:
                records = self._filter_records_by_date_and_employee(data, date)
                if records:
                    metrics = self._calculate_daily_metrics(records)
                    metrics_data.append(
                        {
                            "date": date,
                            "total_hours": metrics.total_hours,
                            "active_hours": metrics.active_hours,
                            "inactive_hours": metrics.inactive_hours,
                            "afk_hours": metrics.afk_hours,
                            "activity_rate": metrics.activity_rate,
                            "inactivity_rate": metrics.inactivity_rate,
                            "afk_rate": metrics.afk_rate,
                            "total_records": metrics.total_records,
                        }
                    )

            if not metrics_data:
                print("❌ No valid metrics data found for histogram creation")
                return

            # Create DataFrame
            df = pd.DataFrame(metrics_data)

            # Set up the plotting style
            plt.style.use("default")
            sns.set_palette("husl")

            # Create figure with subplots
            fig, axes = plt.subplots(2, 3, figsize=(18, 12))
            fig.suptitle(
                f"Activity Metrics Distribution for {EMPLOYEE_ID}",
                fontsize=16,
                fontweight="bold",
            )

            # 1. Total Hours Distribution
            axes[0, 0].hist(
                df["total_hours"],
                bins=15,
                alpha=0.7,
                color="skyblue",
                edgecolor="black",
            )
            axes[0, 0].set_title("Total Hours per Day Distribution", fontweight="bold")
            axes[0, 0].set_xlabel("Hours")
            axes[0, 0].set_ylabel("Frequency")
            axes[0, 0].grid(True, alpha=0.3)
            axes[0, 0].axvline(
                df["total_hours"].mean(),
                color="red",
                linestyle="--",
                label=f'Mean: {df["total_hours"].mean():.2f}h',
            )
            axes[0, 0].legend()

            # 2. Active Hours Distribution
            axes[0, 1].hist(
                df["active_hours"],
                bins=15,
                alpha=0.7,
                color="lightgreen",
                edgecolor="black",
            )
            axes[0, 1].set_title("Active Hours per Day Distribution", fontweight="bold")
            axes[0, 1].set_xlabel("Hours")
            axes[0, 1].set_ylabel("Frequency")
            axes[0, 1].grid(True, alpha=0.3)
            axes[0, 1].axvline(
                df["active_hours"].mean(),
                color="red",
                linestyle="--",
                label=f'Mean: {df["active_hours"].mean():.2f}h',
            )
            axes[0, 1].legend()

            # 3. Activity Rate Distribution
            axes[0, 2].hist(
                df["activity_rate"],
                bins=15,
                alpha=0.7,
                color="orange",
                edgecolor="black",
            )
            axes[0, 2].set_title("Activity Rate Distribution", fontweight="bold")
            axes[0, 2].set_xlabel("Activity Rate (%)")
            axes[0, 2].set_ylabel("Frequency")
            axes[0, 2].grid(True, alpha=0.3)
            axes[0, 2].axvline(
                df["activity_rate"].mean(),
                color="red",
                linestyle="--",
                label=f'Mean: {df["activity_rate"].mean():.1f}%',
            )
            axes[0, 2].legend()

            # 4. Inactive Hours Distribution
            axes[1, 0].hist(
                df["inactive_hours"],
                bins=15,
                alpha=0.7,
                color="lightcoral",
                edgecolor="black",
            )
            axes[1, 0].set_title(
                "Inactive Hours per Day Distribution", fontweight="bold"
            )
            axes[1, 0].set_xlabel("Hours")
            axes[1, 0].set_ylabel("Frequency")
            axes[1, 0].grid(True, alpha=0.3)
            axes[1, 0].axvline(
                df["inactive_hours"].mean(),
                color="red",
                linestyle="--",
                label=f'Mean: {df["inactive_hours"].mean():.2f}h',
            )
            axes[1, 0].legend()

            # 5. Total Records Distribution
            axes[1, 1].hist(
                df["total_records"],
                bins=15,
                alpha=0.7,
                color="mediumpurple",
                edgecolor="black",
            )
            axes[1, 1].set_title(
                "Daily Activity Records Distribution", fontweight="bold"
            )
            axes[1, 1].set_xlabel("Number of Records")
            axes[1, 1].set_ylabel("Frequency")
            axes[1, 1].grid(True, alpha=0.3)
            axes[1, 1].axvline(
                df["total_records"].mean(),
                color="red",
                linestyle="--",
                label=f'Mean: {df["total_records"].mean():.0f}',
            )
            axes[1, 1].legend()

            # Hide the third chart in the bottom row
            axes[1, 2].set_visible(False)

            plt.tight_layout()

            # Save the histogram
            output_file = f"activity_histograms_{EMPLOYEE_ID}.png"
            plt.savefig(output_file, dpi=300, bbox_inches="tight")

            print(f"\n📊 HISTOGRAM CHARTS CREATED")
            print("=" * 50)
            print(f"📈 Charts saved as: {output_file}")
            print(f"📊 Data points analyzed: {len(df)} days")

            # Print summary statistics
            print(f"\n📋 SUMMARY STATISTICS:")
            print(
                f"   Total Hours    - Mean: {df['total_hours'].mean():.2f}h, Std: {df['total_hours'].std():.2f}h"
            )
            print(
                f"   Active Hours   - Mean: {df['active_hours'].mean():.2f}h, Std: {df['active_hours'].std():.2f}h"
            )
            print(
                f"   Activity Rate  - Mean: {df['activity_rate'].mean():.1f}%, Std: {df['activity_rate'].std():.1f}%"
            )
            print(
                f"   Inactive Hours - Mean: {df['inactive_hours'].mean():.2f}h, Std: {df['inactive_hours'].std():.2f}h"
            )
            print(
                f"   Daily Records  - Mean: {df['total_records'].mean():.0f}, Std: {df['total_records'].std():.0f}"
            )

            plt.show()

        except Exception as e:
            logger.error(f"Error creating histogram charts: {e}")
            print(f"❌ Error creating histogram charts: {e}")
            print("💡 Make sure pandas, matplotlib, and seaborn are installed:")
            print("   pip install pandas matplotlib seaborn")

    def analyze_all_dates_summary(self, available_dates: List[str]) -> None:
        """Analyze summary for all available dates."""
        if not available_dates:
            print("❌ No data available for analysis")
            return

        logger.info(f"Analyzing summary for {len(available_dates)} dates")

        try:
            data = self._load_activity_data()

            print(f"\n📊 ALL DATES SUMMARY ANALYSIS FOR {EMPLOYEE_ID}")
            print("=" * 70)

            total_days = len(available_dates)
            total_active_hours = 0.0
            total_tracked_hours = 0.0
            total_afk_hours = 0.0
            total_inactive_hours = 0.0

            print(f"📅 Analyzing {total_days} days of data:")

            for date in available_dates:
                records = self._filter_records_by_date_and_employee(data, date)

                if records:
                    metrics = self._calculate_daily_metrics(records)

                    total_active_hours += metrics.active_hours
                    total_tracked_hours += metrics.total_hours
                    total_afk_hours += metrics.afk_hours
                    total_inactive_hours += metrics.inactive_hours

                    print(
                        f"   {date}: {metrics.active_hours:.2f}h active ({metrics.activity_rate:.1f}%) & "
                        f"{metrics.inactive_hours:.2f}h inactive ({metrics.inactivity_rate:.1f}%) "
                        f"of {metrics.total_hours:.2f}h total"
                    )

            # Overall summary
            avg_active_hours = total_active_hours / total_days if total_days > 0 else 0
            avg_total_hours = total_tracked_hours / total_days if total_days > 0 else 0
            avg_inactive_hours = (
                total_inactive_hours / total_days if total_days > 0 else 0
            )
            overall_activity_rate = (
                (total_active_hours / total_tracked_hours * 100)
                if total_tracked_hours > 0
                else 0
            )

            print("\n📈 OVERALL SUMMARY:")
            print(f"   Total Days Analyzed: {total_days}")
            print(f"   Total Active Hours: {total_active_hours:.2f}h")
            print(f"   Total Tracked Hours: {total_tracked_hours:.2f}h")
            print(f"   Total Inactive Hours: {total_inactive_hours:.2f}h")
            print(f"   Average Active Hours/Day: {avg_active_hours:.2f}h")
            print(f"   Average Total Hours/Day: {avg_total_hours:.2f}h")
            print(f"   Average Inactive Hours/Day: {avg_inactive_hours:.2f}h")
            print(f"   Overall Activity Rate: {overall_activity_rate:.1f}%")

            print(
                f"\n✅ SUMMARY COMPLETE: {EMPLOYEE_ID} worked {total_active_hours:.2f} hours across {total_days} days"
            )
            print(f"   (Average: {avg_active_hours:.2f}h active per day)")

        except Exception as e:
            logger.error(f"Error analyzing all dates summary: {e}")
            print(f"❌ Error analyzing summary: {e}")


class UserInterface:
    """Handle user interactions and input validation."""

    def __init__(self, analyzer: ActivityAnalyzer) -> None:
        """Initialize with activity analyzer."""
        self.analyzer = analyzer

    @staticmethod
    def validate_date_format(date_string: str) -> bool:
        """Validate date format YYYY-MM-DD."""
        try:
            datetime.strptime(date_string, "%Y-%m-%d")
            return True
        except ValueError:
            return False

    def get_user_choice(self) -> AnalysisChoice:
        """Get analysis choice and target date from user input with validation."""
        print("\n📝 CONFIGURATION SETUP")
        print("=" * 50)

        # Show available dates
        available_dates = self.analyzer.get_available_dates()
        if available_dates:
            print("\n📋 Available dates in data:")
            recent_dates = (
                available_dates[-10:] if len(available_dates) > 10 else available_dates
            )
            for date in recent_dates:
                print(f"   • {date}")
            if len(available_dates) > 10:
                print(f"   ... and {len(available_dates) - 10} more dates")
            print(f"\n   Total: {len(available_dates)} days of data available")

        # Get analysis choice
        while True:
            print("\nChoose analysis type:")
            print("1. Specific Date")
            print("2. All Available Dates Summary")
            print("3. Create Histogram Charts")
            choice = input("\nEnter choice (1, 2, or 3): ").strip()

            if choice == "1":
                target_date = self._get_target_date(available_dates)
                if target_date:
                    return AnalysisChoice(type="specific", date=target_date, dates=None)
            elif choice == "2":
                return AnalysisChoice(type="summary", date=None, dates=available_dates)
            elif choice == "3":
                return AnalysisChoice(
                    type="histogram", date=None, dates=available_dates
                )
            else:
                print("❌ Invalid choice. Please enter 1, 2, or 3.")

    def _get_target_date(self, available_dates: List[str]) -> Optional[str]:
        """Get and validate target date from user."""
        while True:
            target_date = input(
                "\n📅 Enter target date for specific analysis (YYYY-MM-DD): "
            ).strip()

            if not self.validate_date_format(target_date):
                print(
                    "❌ Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-08-27)"
                )
                continue

            if not available_dates or target_date in available_dates:
                return target_date

            print(f"⚠️  Date {target_date} not found in data, but will proceed anyway")
            confirm = input("Continue with this date? (y/n): ").strip().lower()
            if confirm in ["y", "yes"]:
                return target_date


def main() -> None:
    """Main function to perform analysis based on user choice."""
    print("🔍 ENHANCED ACTIVITY TRACKER ANALYSIS")
    print("=" * 50)
    print("Configuration loaded from config.py:")
    print(f"  Employee: {EMPLOYEE_ID}")
    print("=" * 50)

    try:
        analyzer = ActivityAnalyzer()
        ui = UserInterface(analyzer)

        user_choice = ui.get_user_choice()

        # Perform analysis based on choice
        if user_choice["type"] == "specific":
            target_date = user_choice.get("date")
            if target_date:
                analyzer.analyze_specific_date(target_date)
            else:
                print("❌ Invalid target date format")
        elif user_choice["type"] == "summary":
            dates = user_choice.get("dates")
            if dates:
                analyzer.analyze_all_dates_summary(dates)
            else:
                print("❌ Invalid dates format")
        elif user_choice["type"] == "histogram":
            dates = user_choice.get("dates")
            if dates:
                analyzer.create_histogram_charts(dates)
            else:
                print("❌ Invalid dates format")

    except Exception as e:
        logger.error(f"Application error: {e}")
        print(f"❌ Application error: {e}")


if __name__ == "__main__":
    main()
