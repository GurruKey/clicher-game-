from .race_view_base import RaceViewBase
from .race_view_lists import RaceViewListMixin
from .race_view_data import RaceViewDataMixin
from .race_view_actions_core import RaceViewActionCoreMixin
from .race_view_level_editor import RaceViewLevelEditorMixin
from .race_view_level_actions import RaceViewLevelActionsMixin
from .race_view_actions_race import RaceViewRaceActionMixin
from .race_view_actions_tag import RaceViewTagActionMixin
from .race_view_select import RaceViewSelectMixin


class RaceView(
    RaceViewBase,
    RaceViewListMixin,
    RaceViewDataMixin,
    RaceViewActionCoreMixin,
    RaceViewLevelEditorMixin,
    RaceViewLevelActionsMixin, 
    RaceViewRaceActionMixin,
    RaceViewTagActionMixin,
    RaceViewSelectMixin
):
    def __init__(
        self,
        parent,
        races,
        race_variants,
        race_levels=None,
        race_tags=None,
        races_root=None,
        race_tags_root=None,
        race_levels_root=None
    ) -> None:
        super().__init__(
            parent,
            races,
            race_variants,
            race_levels=race_levels,
            race_tags=race_tags,
            races_root=races_root,
            race_tags_root=race_tags_root,
            race_levels_root=race_levels_root
        )
        self.init_list_states()
        self.init_data()
        self.init_actions()
        self.init_level_editor_actions()
        self.search_entry.bind("<KeyRelease>", self.on_filter_change)
        self.on_filter_change()


def create_bloodline_race_view(
    parent,
    races,
    race_variants,
    race_levels=None,
    race_tags=None,
    races_root=None,
    race_tags_root=None,
    race_levels_root=None
) -> None:
    RaceView(
        parent,
        races,
        race_variants,
        race_levels=race_levels,
        race_tags=race_tags,
        races_root=races_root,
        race_tags_root=race_tags_root,
        race_levels_root=race_levels_root
    )
